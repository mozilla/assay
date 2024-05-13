import * as vscode from "vscode";

let commentId = 0;

export type contextValues = "comment" | "verdictComment" | "verdict";

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
		public state?: vscode.CommentThreadState | undefined,
	) {
		this.canReply = false;
	}
}

export class AssayReply implements vscode.CommentReply {
	constructor(
		public thread: AssayThread,
		public text: string
	){
		this.thread.canReply = false;
	}

}

export class AssayComment implements vscode.Comment {
	id: number;
	label: string | undefined;
	savedBody: string | vscode.MarkdownString;
	constructor(
		public body: string | vscode.MarkdownString,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public thread: AssayThread,
		public contextValue: contextValues
	) {
		this.id = ++commentId;
		this.savedBody = this.body;
	}
}