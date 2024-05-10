
import * as vscode from "vscode";

import AssayComment from "../class/comment";
import { getCommentLocation } from "../utils/commentInfo";
import createComment from "../utils/createComment";

export async function addComment(reply: vscode.CommentReply){
    reply.thread.label = await getCommentLocation(reply.thread);
    reply.thread.canReply = false;
    createComment("Comments:", reply, "comment");
}


export function deleteComment(comment: AssayComment){
    if (comment.thread) {
        comment.thread.dispose();
    }
 }


export function cancelSaveComment(comment: AssayComment){
    if(!comment.thread) {
        return;
    }

    comment.thread.comments = comment.thread.comments.map( cmt => {
        const assayCmt = cmt as AssayComment;
        if(assayCmt.id === comment.id){
            assayCmt.body = assayCmt.savedBody;
            assayCmt.mode = vscode.CommentMode.Preview;
        }
        return assayCmt;
    });
    
 }


export function saveComment(comment: AssayComment){
    if (!comment.thread) {
        return;
    }

    comment.thread.comments = comment.thread.comments.map(cmt => {
        const assayCmt = cmt as AssayComment;
        if (assayCmt.id === comment.id) {
            assayCmt.savedBody = cmt.body;
            cmt.mode = vscode.CommentMode.Preview;
        }

        return cmt;
    });
 }


export function editComment(comment: AssayComment){
    if (!comment.thread) {
        return;
    }

    comment.thread.comments = comment.thread.comments.map(cmt => {
        const assayCmt = cmt as AssayComment;
        if (assayCmt.id === comment.id) {
            cmt.mode = vscode.CommentMode.Editing;
        }
        return cmt;
    });
 }