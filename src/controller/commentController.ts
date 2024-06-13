import * as vscode from "vscode";

import { getRootFolderPath } from "./rootController";
import { loadFileDecorator } from "./sidebarController";
import { addToCache, getFromCache } from "../model/cache";
import { AssayComment, AssayReply, AssayThread } from "../model/comment";
import { CommentsCache, contextValues } from "../types";
import {
  rangeToString,
  rangeTruncation,
  splitUri,
  stringToRange,
} from "../utils/helper";
import getDeleteCommentsPreference from "../views/exportView";

export class AssayCommentController {
  controller: vscode.CommentController;
  constructor(private id: string, private label: string) {
    this.controller = vscode.comments.createCommentController(id, label);
    this.activateController();
  }

  /**
   * Adds a comment to the reply's thread.
   * @param reply The thread location and text to add.
   */
  async addComment(reply: AssayReply) {
    const contextValue = reply.text ? "comment" : "markForReview";
    const body = new vscode.MarkdownString(
      reply.text ? reply.text : "Marked for review."
    );
    const comment = await this.createComment(contextValue, body, reply.thread);
    if (comment) {
      await this.saveCommentToCache(comment);
    }
    return comment;
  }

  /**
   * Modify the body of the comment.
   * @param comment The saved comment.
   */
  async saveComment(comment: AssayComment) {
    comment.thread.comments = comment.thread.comments.map((cmt) => {
      if (cmt.id === comment.id) {
        cmt.savedBody = cmt.body;
        cmt.mode = vscode.CommentMode.Preview;
        if (cmt.body.value) {
          cmt.contextValue = "comment";
        } else {
          cmt.contextValue = "markForReview";
          cmt.body = new vscode.MarkdownString("Marked for review.");
        }
      }
      return cmt;
    });
    if (comment) {
      await this.saveCommentToCache(comment);
    }
  }

  /**
   * Cancel changes to the comment body.
   * @param comment The cancelled comment.
   */
  async cancelSaveComment(comment: AssayComment) {
    comment.thread.comments = comment.thread.comments.map((cmt) => {
      if (cmt.id === comment.id) {
        cmt.body = cmt.savedBody;
        cmt.mode = vscode.CommentMode.Preview;
      }
      return cmt;
    });
  }

  /**
   * Delete a thread and its contained comments.
   * @param thread The associated thread containing the comment.
   */
  async deleteThread(thread: AssayThread) {
    thread.comments.forEach(async (cmt) => {
      await this.deleteCommentFromCache(cmt);
    });
    thread.dispose();
  }

  /**
   * Set a comment to edit.
   * @param thread The associated thread containing the comment.
   */
  // Due to the associated button's placement, the entire thread is passed.
  // this command sets 'all' the comments to edit.
  // but since we only ever have one comment, it works out.
  editComment(thread: AssayThread) {
    thread.comments = thread.comments.map((cmt) => {
      if (cmt.contextValue === "markForReview") {
        cmt.body = new vscode.MarkdownString();
      }
      cmt.mode = vscode.CommentMode.Editing;
      return cmt;
    });
  }

  /**
   * Export comments from current version.
   */
  async exportComments(thread: AssayThread) {
    await this.exportVersionComments(thread.uri);
  }

  /**

   * Copies a link to the selected line(s) to the clipboard for sharing.
   * @param reply Holds the thread location.
   * @return the generated link.
   */
  async copyLinkFromReply(reply: AssayReply) {
    this.copyLinkFromThread(reply.thread);
  }

  /**
   * Copies a link to the selected line(s) to the clipboard for sharing.
   * @param thread
   * @return the generated link.
   */
  async copyLinkFromThread(thread: AssayThread) {
    const { guid, version, filepath, range } = await this.getThreadLocation(thread);
    const link = `vscode://mozilla.assay/review/${guid}/${version}?path=${filepath}${range}`;
    vscode.env.clipboard.writeText(link);
    vscode.window.showInformationMessage("Link copied to clipboard.");
    return link;
  }

  /*
   * Delete all comments associated with a given version of an add-on.
   * @param uri The URI of a file inside Assay's add-on cache. This will be used
   to determine the add-on's GUID and version number.
   */
  // Deleting comments by [guid, version], while optimal,
  // is not compatible with VS Code's base FileDecorationProvider,
  // which requires the use of file uris directly.
  // To avoid iterating by each individual comment, we can knit together
  // the uri when iterating by file.
  async deleteComments(uri: vscode.Uri) {
    const { guid, version } = await splitUri(uri);
    const rootPath = await getRootFolderPath();
    const comments = await this.fetchCommentsFromCache([guid, version]);

    for (const [filepath] of Object.entries(comments)) {
      // Delete the file in cache.
      await addToCache("comments", [guid, version, filepath], "");
      // Update the file's decorator.
      const commentUri = vscode.Uri.file(
        `${rootPath}/${guid}/${version}/${filepath}`
      );
      await loadFileDecorator(commentUri);
    }
    this.refetchComments();
  }

  //TODO: manager __string__?
  /**
   * Compiles existing comments into a string format.
   * @param guid 
   * @param version 
   * @returns 
   */
  async compileComments(guid: string, version: string) {
    const comments = await getFromCache("comments", [guid, version]);
    let compiledComments = "";
  
    for (const filepath in comments) {
      for (const lineNumber in comments[filepath]) {
        compiledComments += `File:\n${filepath}${rangeTruncation(
          lineNumber
        )}\n\n`;
        const comment = comments[filepath][lineNumber].body;
        compiledComments += `${comment}\n\n`;
      }
    }
    return compiledComments;
  }
  
  /**
   * Handles exporting comments from the context.
   */
  async exportCommentsFromContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const doc = editor.document;
    await this.exportVersionComments(doc.uri);
  }
  
  /**
   * Handles exporting comments from the version uri resides in.
   * @param uri The selected uri.
   */
  async exportVersionComments(uri: vscode.Uri) {
    const { rootFolder, fullPath, guid, version } = await splitUri(uri);
    if (!fullPath.startsWith(rootFolder)) {
      vscode.window.showErrorMessage(
        "(Assay) File is not in the Addons root folder."
      );
      throw new Error("File is not in the root folder");
    }
  
    if (!guid || !version) {
      vscode.window.showErrorMessage(
        "Not a valid path. Ensure you are at least as deep as the version folder."
      );
      throw new Error("No guid or version found");
    }
  
    const comments = await this.compileComments(guid, version);
    await this.exportCommentsToDocument(comments, uri);
  }

  /**
   * Fetches the location of a thread.
   * @param thread The thread to locate.
   * @returns The location of the thread.
   */
  async getThreadLocation(thread: AssayThread) {
    const range = rangeToString(thread.range);
    const { guid, version, filepath } = await this.getFilepathInfo(thread);
    return { guid, version, filepath, range: range };
  }

  /**
   * Dispose of the CommentController.
   */
  dispose() {
    this.controller.dispose();
  }

  /**
   * Exports comments to a TextDocument.
   * @param compiledComments The comments as a string.
   * @param uri The uri of comments to (possibly) delete.
   */
  private async exportCommentsToDocument(
    compiledComments: string,
    uri: vscode.Uri
  ) {
    const document = await vscode.workspace.openTextDocument({
      content: compiledComments,
      language: "text",
    });
  
    vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
  
    if (compiledComments) {
      vscode.env.clipboard.writeText(compiledComments);
      vscode.window.showInformationMessage("Comments copied to clipboard.");
    }
  
    const deleteCachedComments = await getDeleteCommentsPreference();
    if (deleteCachedComments) {
      await this.deleteComments(uri);
    }
  }  
  
  private async getFilepathInfo(thread: AssayThread) {
    const { rootFolder, fullPath, guid, version, filepath } = await splitUri(
      thread.uri
    );
    if (!fullPath.startsWith(rootFolder)) {
      vscode.window.showErrorMessage(
        "(Assay) File is not in the Addons root folder."
      );
      throw new Error("File is not in the root folder.");
    }
    return { guid, version, filepath };
  }

  /**
   * Allows the commenting system to be visible in the gutter.
   */
  private activateController() {
    this.loadCommentsFromCache().then(() => {
      this.controller.commentingRangeProvider = {
        provideCommentingRanges: (document: vscode.TextDocument) => {
          const lineCount = document.lineCount;
          return [new vscode.Range(0, 0, lineCount - 1, 0)];
        },
      };
    });
  }

  /**
   * Refetches comments from cache by disposing & creating a new controller.
   */
  // Not ideal, but the API does not expose its CommentThreads and so the alternative
  // is tracking them with a dictionary in the CmtManager, which to uniquely do so
  // would be recreating the cache structure in runtime (and iterating regardless).
  private async refetchComments() {
    this.controller.dispose();
    this.controller = vscode.comments.createCommentController(
      this.id,
      this.label
    );
    this.activateController();
  }

  /**
   * Helper function to create a comment.
   * @returns the newly created comment.
   */
  private async createComment(
    contextValue: contextValues,
    body: vscode.MarkdownString,
    thread: AssayThread | vscode.CommentThread
  ) {
    const { filepath, range } = await this.getThreadLocation(thread as AssayThread);
    thread.label = `${filepath}${rangeTruncation(range)}`;

    const newComment = new AssayComment(
      body,
      vscode.CommentMode.Preview,
      { name: "Notes:" },
      thread as AssayThread,
      contextValue
    );
    thread.comments = [...thread.comments, newComment];
    return newComment;
  }

  /**
   * Fetch and return existing comments for the workspace from cache.
   * @returns raw cache comments.
   */
  private async fetchCommentsFromCache(keys?: string[]) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace) {
      return;
    }

    const uri = workspace[0].uri;
    const { rootFolder, fullPath } = await splitUri(uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }

    return getFromCache("comments", keys);
  }

  /**
   * Fetch and load existing comments for the workspace from cache.
   * Populates workspace with comments.
   */
  private async loadCommentsFromCache() {
    for (const comment of await this.getCachedCommentIterator()) {
      const { uri, body, contextValue, lineNumber } = comment;
      const range = await stringToRange(lineNumber);
      const thread = this.controller.createCommentThread(uri, range, []);
      this.createComment(contextValue, new vscode.MarkdownString(body), thread);
    }
  }

  /**
   * Save the given comment to cache.
   * @param comment
   */
  private async saveCommentToCache(comment: AssayComment) {
    const { guid, version, filepath, range } = await this.getThreadLocation(
      comment.thread
    );
    await addToCache(
      "comments",
      [guid, version, filepath, range],
      this.formatCacheComment(comment)
    );
  }

  /**
   * Remove the given comment from cache.
   * @param comment
   */
  private async deleteCommentFromCache(comment: AssayComment) {
    const { guid, version, filepath, range } = await this.getThreadLocation(
      comment.thread
    );
    await addToCache("comments", [guid, version, filepath, range], "");
    await loadFileDecorator();
  }

  /**
   *
   * @param comment Comment to format into a json-friendly object.
   * @returns Object with the necessary information for the comment.
   */
  private formatCacheComment(comment: AssayComment) {
    return {
      uri: comment.thread.uri,
      body: comment.savedBody.value,
      contextValue: comment.contextValue,
    };
  }

  /**
   * Fetches comments and returns an iterator.
   * @returns iterator function.
   */
  private async getCachedCommentIterator() {
    const comments = await this.fetchCommentsFromCache();
    return this.iterateByComment(comments);
  }

  /**
   * Iterates through each comment in cache.
   * @param comments The raw cache object.
   */
  private *iterateByComment(comments: CommentsCache) {
    for (const guid in comments) {
      for (const version in comments[guid]) {
        for (const filepath in comments[guid][version]) {
          for (const lineNumber in comments[guid][version][filepath]) {
            yield {
              ...comments[guid][version][filepath][lineNumber],
              lineNumber,
              filepath,
              version,
              guid,
            };
          }
        }
      }
    }
  }
}
