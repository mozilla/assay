import * as vscode from "vscode";

import { getCommentsCacheController } from "../config/globals";
import { AssayComment, AssayReply, AssayThread } from "../model/comment";
import { contextValues } from "../types";
import {
  rangeToString,
  rangeTruncation,
  splitUri,
  stringToRange
} from "../utils/helper";

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
    const commentsCacheController = getCommentsCacheController();
    const didDelete = await commentsCacheController.exportVersionComments(thread.uri);
    if(didDelete){
      this.refetchComments();
    }
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
   * Unpack the location of the thread.
   * @param thread
   * @returns The guid, version, and filepath of the thread.
   */
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
   * Save the given comment to cache.
   * @param comment
   */
  private async saveCommentToCache(comment: AssayComment) {
    const location = await this.getThreadLocation(comment.thread);
    const formattedComment = this.formatCacheComment(comment);
    const commentCacheController = getCommentsCacheController();
    commentCacheController.saveCommentToCache(location, formattedComment);
  }

  /**
   * Delete the given comment from cache.
   * @param comment 
   */
  private async deleteCommentFromCache(comment: AssayComment) {
    const location = await this.getThreadLocation(comment.thread);
    const commentCacheController = getCommentsCacheController();
    commentCacheController.deleteCommentFromCache(location);
  }

  /**
   * Formats a comment to a json-friendly object.
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
   * Fetch and load existing comments for the workspace from cache.
   * Populates workspace with comments.
   */
  private async loadCommentsFromCache() {
    const commentCacheController = getCommentsCacheController();
    const comments = await commentCacheController.getCachedCommentIterator();
    for (const comment of comments) {
      const { uri, body, contextValue, lineNumber } = comment;
      const range = await stringToRange(lineNumber);
      const thread = this.controller.createCommentThread(uri, range, []);
      this.createComment(contextValue, new vscode.MarkdownString(body), thread);
    }
  }

}
