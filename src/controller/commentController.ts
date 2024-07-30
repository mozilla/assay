import * as vscode from "vscode";

import { CommentCacheController } from "./commentCacheController";
import { DirectoryController } from "./directoryController";
import { RangeHelper } from "../helper/rangeHelper";
import { AssayComment, AssayThread } from "../model/assayComment";
import { AddonTreeItem } from "../model/sidebarTreeDataProvider";
export class CommentController {
  controller: vscode.CommentController;

  constructor(
    public id: string,
    public label: string,
    private commentCacheController: CommentCacheController,
    private directoryController: DirectoryController
  ) {
    this.controller = vscode.comments.createCommentController(id, label);
    this.loadCommentsFromCache();
  }

  /**
   * Deletes the comments from the selected uris.
   * @param treeItem The specific AddonTreeItem the user opened the context menu on.
   * @param list Selected AddonTreeItems
   * @returns whether all were successfully deleted.
   */
  async deleteCommentsFromMenu(
    treeItem: AddonTreeItem,
    list: AddonTreeItem[] | undefined
  ) {
    const promises = [];
    const failedUris: vscode.Uri[] = [];
    list = list || [treeItem];

    for (const item of list) {
      const promise = this.commentCacheController
        .deleteComments(item.uri)
        .catch(() => failedUris.push(item.uri));
      promises.push(promise);
    }

    await Promise.all(promises);
    this.refetchComments();
    return failedUris;
  }

  /**
   * Creates the comment thread.
   * @returns the created comment.
   */
  async addComment() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selections[0];
      const endCharacter = document.lineAt(selection.end).text.length;
      const range = RangeHelper.fromSelection(selection, endCharacter);
      const comment = await this.createComment(document.uri, range);
      await this.saveCommentToCache(comment);
      return comment;
    } else {
      throw new Error("No active text editor found.");
    }
  }

  /**
   * Delete a thread and its contained comments.
   * @param thread The associated thread containing the comment.
   */
  async deleteThread(thread: AssayThread) {
    for (const cmt of thread.comments) {
      await this.deleteCommentFromCache(cmt);
    }
    thread.dispose();
  }

  /**
   * Export comments from current version via menu.
   */
  async exportComments(item: AssayThread | AddonTreeItem) {
    const didDelete = await this.commentCacheController.exportVersionComments(
      item.uri
    );
    if (didDelete) {
      this.refetchComments();
    }
  }

  /**
   * Copies a link to the selected line(s) to the clipboard for sharing.
   * @param thread The thread containing the selected lines
   * @return the generated link.
   */
  async copyLinkFromThread(thread: AssayThread) {
    const { guid, version, filepath, range } = await this.getThreadLocation(
      thread
    );
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
    const range = RangeHelper.toString(thread.range);
    const { guid, version, filepath } = await this.getFilepathInfo(thread);
    return { uri: thread.uri, guid, version, filepath, range: range };
  }

  /**
   * Dispose of the CommentController.
   */
  dispose() {
    this.controller.dispose();
  }

  /**
   * Creates a comment on uri with the selected range.
   * @param uri The file to create the comment on.
   * @param range The range of the comment.
   * @returns The created comment.
   */
  private async createComment(uri: vscode.Uri, range: vscode.Range) {
    const comment = new AssayComment(
      "Marked for review.",
      vscode.CommentMode.Preview,
      { name: "Notes:" }
    );
    const thread = this.controller.createCommentThread(uri, range, [comment]);
    comment.thread = thread as AssayThread;
    thread.collapsibleState = 1;
    thread.canReply = false;

    const { filepath, range: rangeString } = await this.getThreadLocation(
      thread as AssayThread
    );
    thread.label = `${filepath}${RangeHelper.truncate(rangeString)}`;

    return comment;
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
    this.loadCommentsFromCache();
  }

  /**
   * Unpack the location of the thread.
   * @param thread
   * @returns The guid, version, and filepath of the thread.
   */
  private async getFilepathInfo(thread: AssayThread) {
    const { rootFolder, fullPath, guid, version, filepath } =
      await this.directoryController.splitUri(thread.uri);
    if (!fullPath.startsWith(rootFolder)) {
      vscode.window.showErrorMessage(
        "(Assay) File is not in the Addons root folder."
      );
      throw new Error("File is not in the root folder.");
    }
    return { guid, version, filepath };
  }

  /**
   * Save the given comment to cache.
   * @param comment
   */
  private async saveCommentToCache(comment: AssayComment) {
    if (!comment.thread) {
      throw new Error("No associated thread in comment.");
    }
    const location = await this.getThreadLocation(comment.thread);
    const formattedComment = this.formatCacheComment(comment);
    this.commentCacheController.saveCommentToCache(location, formattedComment);
  }

  /**
   * Delete the given comment from cache.
   * @param comment
   */
  private async deleteCommentFromCache(comment: AssayComment) {
    if (!comment.thread) {
      throw new Error("No associated thread in comment.");
    }
    const location = await this.getThreadLocation(comment.thread);
    this.commentCacheController.deleteCommentFromCache(location);
  }

  /**
   * Formats a comment to a json-friendly object.
   * @param comment Comment to format into a json-friendly object.
   * @returns Object with the necessary information for the comment.
   */
  private formatCacheComment(comment: AssayComment) {
    if (!comment.thread) {
      throw new Error("No associated thread in comment.");
    }
    return {
      uri: comment.thread.uri,
      body: comment.body,
    };
  }

  /**
   * Fetch and load existing comments for the workspace from cache.
   * Populates workspace with comments.
   */
  private async loadCommentsFromCache() {
    const comments =
      await this.commentCacheController.getCachedCommentIterator();
    const pairs = new Set<{ uri: vscode.Uri; range: vscode.Range }>();
    for (const comment of comments) {
      const { uri, lineNumber } = comment;
      const { startLine, endLine } = RangeHelper.splitString(lineNumber);
      const endCharacter = (
        await this.directoryController.getLineFromFile(uri, endLine)
      ).length;
      const range = RangeHelper.fromNumber(startLine, endLine, endCharacter);
      pairs.add({ uri, range });
    }
    for (const { uri, range } of pairs) {
      this.createComment(uri, range);
    }
  }
}
