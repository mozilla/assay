
import * as vscode from "vscode";

import getCommentLocation from "./getCommentLocation";
import { AssayComment, AssayThread, contextValues } from "../config/comment";

export default async function createComment(contextValue: contextValues, body: vscode.MarkdownString, thread: AssayThread | vscode.CommentThread) {
    
    const { string } = await getCommentLocation(thread as AssayThread);
    thread.label = string;
    
    const newComment = new AssayComment(
        body, 
        vscode.CommentMode.Preview, 
        { name: "Notes:" }, 
        thread as AssayThread, 
        contextValue);
    thread.comments = [...thread.comments, newComment];
    return newComment;
}