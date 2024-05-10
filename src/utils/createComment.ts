
import * as vscode from "vscode";

import AssayComment from "../class/comment";

export default function createComment(name: string, reply: vscode.CommentReply, contextValue?: string) {
    const thread = reply.thread;
    const newComment = new AssayComment(new vscode.MarkdownString(reply.text), vscode.CommentMode.Preview, { name: name }, thread, contextValue);
    thread.comments = [...thread.comments, newComment];
}