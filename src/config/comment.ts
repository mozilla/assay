import * as vscode from "vscode";

import { contextValues } from "../types";

let commentId = 0;
export class AssayThread implements vscode.CommentThread {
  canReply: boolean;
  constructor(
    public uri: vscode.Uri,
    public range: vscode.Range,
    public comments: readonly AssayComment[],
    public collapsibleState: vscode.CommentThreadCollapsibleState,
    public dispose: () => void,
    public label?: string | undefined,
    public contextValue?: string | undefined,
    public state?: vscode.CommentThreadState | undefined
  ) {
    this.canReply = false;
  }
}

export class AssayReply implements vscode.CommentReply {
  constructor(public thread: AssayThread, public text: string) {}
}

export class AssayComment implements vscode.Comment {
  id: number;
  label: string | undefined;
  savedBody: vscode.MarkdownString;
  constructor(
    public body: vscode.MarkdownString,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public thread: AssayThread,
    public contextValue: contextValues
  ) {
    this.id = ++commentId;
    this.savedBody = body;
    this.thread.canReply = false;
  }
}
