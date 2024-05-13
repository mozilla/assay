
import * as vscode from "vscode";

import { AssayComment, AssayReply } from "../class/comment";
import createComment from "../utils/createComment";
import getCommentLocation from "../utils/getCommentLocation";

export async function addComment(reply: AssayReply){
    const { string } = await getCommentLocation(reply.thread);
    reply.thread.label = string;
    createComment("comment", "Comments:", reply);
}

export function deleteComment(comment: AssayComment){
    comment.thread.dispose();
 }

export async function saveComment(comment: AssayComment){
    comment.thread.comments = comment.thread.comments.map(cmt => {
        if (cmt.id === comment.id) {
            cmt.savedBody = cmt.body;
            cmt.mode = vscode.CommentMode.Preview;
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
            cmt.mode = vscode.CommentMode.Editing;
        }
        return cmt;
    });
 }