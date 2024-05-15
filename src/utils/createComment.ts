
import * as vscode from "vscode";

import { AssayComment, AssayThread, contextValues } from "../class/comment";

export default function createComment(contextValue: contextValues, body: vscode.MarkdownString, thread: AssayThread | vscode.CommentThread) {
    const newComment = new AssayComment(
        body, 
        vscode.CommentMode.Preview, 
        { name: "Notes" }, 
        thread as AssayThread, 
        contextValue);
    thread.comments = [...thread.comments, newComment];
    return newComment;
}