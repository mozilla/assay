import * as vscode from "vscode";

import { addToCache, getFromCache } from "./addonCache";
import getCommentLocation, {
  rangeTruncation,
  stringToRange,
} from "./getThreadLocation";
import { loadFileDecorator } from "./loadFileDecorator";
import { splitUri } from "./splitUri";
import {
  AssayComment,
  AssayReply,
  AssayThread,
  contextValues,
} from "../config/comment";

export class commentManager {
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

    this.addComment = this.addComment.bind(this);
    this.deleteThread = this.deleteThread.bind(this);
    this.cancelSaveComment = this.cancelSaveComment.bind(this);
    this.saveComment = this.saveComment.bind(this);
    this.editComment = this.editComment.bind(this);
    this.dispose = this.dispose.bind(this);

    this.createComment = this.createComment.bind(this);
    this.fetchCommentsFromCache = this.fetchCommentsFromCache.bind(this);
    this.saveCommentToCache = this.saveCommentToCache.bind(this);
    this.deleteCommentFromCache = this.deleteCommentFromCache.bind(this);
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
   * Dispose of the commentManager.
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
    const { rootFolder, fullPath, guid } = await splitUri(uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }

    const comments = await getFromCache(guid, ["comments"]);

    for (const version in comments) {
      for (const filepath in comments[version]) {
        for (const lineNumber in comments[version][filepath]) {
          const { uri, body, contextValue } =
            comments[version][filepath][lineNumber];
          const r = stringToRange(lineNumber);
          const thread = this.controller.createCommentThread(uri, r, []);
          this.createComment(
            contextValue,
            new vscode.MarkdownString(body),
            thread
          );
        }
      }
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
    await addToCache(guid, ["comments", version, filepath, range], comment);
  }

  /**
   * Remove the given comment to cache.
   * @param comment
   */
  private async deleteCommentFromCache(comment: AssayComment) {
    const { guid, version, filepath, range } = await getCommentLocation(
      comment.thread
    );
    await addToCache(guid, ["comments", version, filepath, range], "");
    await loadFileDecorator();
  }
}
