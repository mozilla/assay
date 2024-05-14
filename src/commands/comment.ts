
import * as vscode from "vscode";

import { deleteCommentFromCache, saveCommentToCache } from "./cacheComment";
import { AssayComment, AssayReply, AssayThread } from "../class/comment";
import createComment from "../utils/createComment";
import getCommentLocation from "../utils/getCommentLocation";

export async function addComment(reply: AssayReply){
    const {string} = await getCommentLocation(reply.thread);
    reply.thread.label = string;

    const contextValue = reply.text ? "comment" : "markForReview";
    const body = new vscode.MarkdownString(reply.text ? reply.text : "Marked for review.");

    const comment = createComment(contextValue, "Notes:", body, reply.thread);
    await saveCommentToCache(comment);
}

export async function deleteThread(thread: AssayThread){
    thread.comments.forEach(async cmt => {
        await deleteCommentFromCache(cmt);
    });
    thread.dispose();    
 }

export async function saveComment(comment: AssayComment){
    comment.thread.comments = comment.thread.comments.map(cmt => {
        if (cmt.id === comment.id) {
            cmt.savedBody = cmt.body;
            cmt.mode = vscode.CommentMode.Preview;
            if(cmt.body.value){
                cmt.contextValue = "comment";
            }
            else{
                cmt.contextValue = "markForReview";
                cmt.body = new vscode.MarkdownString("Marked for review.");
            }
        }
        return cmt;
    });
    await saveCommentToCache(comment);
 }

 export function cancelSaveComment(comment: AssayComment){
    comment.thread.comments = comment.thread.comments.map( cmt => {
        if(cmt.id === comment.id){
            cmt.body = cmt.savedBody;
            cmt.mode = vscode.CommentMode.Preview;
        }
        return cmt;
    });
 }

 // Due to the associated button's placement, the entire thread is passed.
 // this command sets 'all' the comments to edit.
 // but since we only ever have one comment, it works out.
 // The same logic could apply for the other functions, but this is the
 // only one where there's no alternative I can think of.
export function editComment(thread: AssayThread){
    thread.comments = thread.comments.map(cmt => {
        if(cmt.contextValue === 'markForReview'){
            cmt.body = new vscode.MarkdownString();
        }
        cmt.mode = vscode.CommentMode.Editing;
        return cmt;
    });
 }
 