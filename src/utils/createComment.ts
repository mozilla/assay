
import * as vscode from "vscode";

import { AssayComment, AssayReply, contextValues } from "../class/comment";

export default function createComment(contextValue: contextValues, name: string, reply: AssayReply) {
    reply.thread.canReply = false;
    const newComment = new AssayComment(new vscode.MarkdownString(reply.text), vscode.CommentMode.Preview, { name: name }, reply.thread, contextValue);
    reply.thread.comments = [...reply.thread.comments, newComment];
}