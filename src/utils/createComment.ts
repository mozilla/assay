
import * as vscode from "vscode";

import { AssayComment, AssayThread, contextValues } from "../class/comment";

export default function createComment(contextValue: contextValues, name: string, body: vscode.MarkdownString, thread: AssayThread) {
    thread.canReply = false;
    const newComment = new AssayComment(
        body, 
        vscode.CommentMode.Preview, 
        { name: name }, 
        thread, 
        contextValue);
    thread.comments = [...thread.comments, newComment];
}