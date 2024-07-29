import * as vscode from "vscode";

export class AssayThread implements vscode.CommentThread {
  canReply: boolean;
  constructor(
    public uri: vscode.Uri,
    public range: vscode.Range,
    public comments: readonly AssayComment[],
    public collapsibleState: vscode.CommentThreadCollapsibleState,
    public dispose: () => void,
    public label?: string | undefined,
    public state?: vscode.CommentThreadState | undefined
  ) {
    this.canReply = false;
  }
}

export class AssayComment implements vscode.Comment {
  constructor(
    public body: string,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public thread: AssayThread
  ) {
    this.thread.canReply = false;
  }
}
