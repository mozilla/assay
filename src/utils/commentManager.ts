import * as vscode from "vscode";

import { addToCache, getFromCache } from "./addonCache";
import getCommentLocation, {
  rangeTruncation,
  stringToRange,
} from "./getThreadLocation";
import getThreadLocation from "./getThreadLocation";
import { loadFileDecorator } from "./loadFileDecorator";
import { splitUri } from "./splitUri";
import { exportVersionComments } from "../commands/exportComments";
import {
  AssayComment,
  AssayReply,
  AssayThread,
  CommentsCache,
  contextValues,
} from "../config/comment";

export class CommentManager {
  controller: vscode.CommentController;
  constructor(id: string, label: string) {
    this.controller = vscode.comments.createCommentController(id, label);

    this.fetchCommentsFromCache().then(() => {
      this.controller.commentingRangeProvider = {
        provideCommentingRanges: (document: vscode.TextDocument) => {
          const lineCount = document.lineCount;
          return [new vscode.Range(0, 0, lineCount - 1, 0)];
        },
      };
    });
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
   *
   * Due to the associated button's placement, the entire thread is passed.
   * this command sets 'all' the comments to edit.
   * but since we only ever have one comment, it works out.
   * @param thread The associated thread containing the comment.
   */
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
    await exportVersionComments(thread.uri);
  }

  /**
   * Copies a link to the selected line(s) to the clipboard for sharing.
   * @param reply Holds the thread location.
   */
  async copyLinkFromReply(reply: AssayReply){
    this.copyLinkFromThread(reply.thread);
  }

  /**
   * Copies a link to the selected line(s) to the clipboard for sharing.
   * @param thread
   */
  async copyLinkFromThread(thread: AssayThread){
    const { guid, version, filepath, range } = await getThreadLocation(thread);
    const link = `vscode://mozilla.assay/review/${guid}/${version}?path=${encodeURI(filepath)}${range}`;
    vscode.env.clipboard.writeText(link);
    vscode.window.showInformationMessage("Link copied to clipboard.");
  }

  /**
   * Dispose of the CommentManager.
   */
  dispose() {
    this.controller.dispose();
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
    const { filepath, range } = await getCommentLocation(thread as AssayThread);
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
   * Fetch existing comments for the workspace from cache.
   * Populates workspace with comments.
   */
  private async fetchCommentsFromCache() {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace) {
      return;
    }

    const uri = workspace[0].uri;
    const { rootFolder, fullPath } = await splitUri(uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }

    const comments = await getFromCache("comments");

    for (const { uri, body, contextValue, lineNumber } of this.iterateComments(
      comments
    )) {
      const r = stringToRange(lineNumber);
      const thread = this.controller.createCommentThread(uri, r, []);
      this.createComment(contextValue, new vscode.MarkdownString(body), thread);
    }
  }

  /**
   * Save the given comment to cache.
   * @param comment
   */
  private async saveCommentToCache(comment: AssayComment) {
    const { guid, version, filepath, range } = await getCommentLocation(
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
    const { guid, version, filepath, range } = await getCommentLocation(
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
   * Iterates through each comment in cache.
   * @param comments The raw cache object.
   */
  private *iterateComments(comments: CommentsCache) {
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
