
import * as vscode from "vscode";

import { AssayComment, AssayReply } from "../class/comment";
import createComment from "../utils/createComment";
import getCommentLocation from "../utils/getCommentLocation";

export async function addComment(reply: AssayReply){
    const { string } = await getCommentLocation(reply.thread);
    reply.thread.label = string;

    const contextValue = reply.text ? "comment" : "markForReview";
    const body = new vscode.MarkdownString(reply.text ? reply.text : "Marked for review.");

    createComment(contextValue, "Notes:", body, reply.thread);    
}

export function deleteComment(comment: AssayComment){
    comment.thread.dispose();
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

export function editComment(comment: AssayComment){
    comment.thread.comments = comment.thread.comments.map(cmt => {
        if (cmt.id === comment.id) {
            if(cmt.contextValue === 'markForReview'){
                cmt.body = new vscode.MarkdownString();
            }
            cmt.mode = vscode.CommentMode.Editing;
        }
        return cmt;
    });
 }
 