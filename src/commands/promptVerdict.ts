import * as vscode from "vscode";

import { AssayComment } from "../class/comment";
import createComment from "../utils/createComment";


export async function selectVerdict(comment: AssayComment) {

    // TODO: Replace with proper fetch.
    const items = ['Reason One', 'Second Reason', 'Another Reason'];

    const result = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Verdicts',
        onDidSelectItem: (item) => {
            vscode.window.showInformationMessage(`Focused on: ${item}`);
        },
        canPickMany: true
    });

    if(!result){
        throw new Error("Failed to fetch VSC QuickPick menu.");
    }

    // if there exists a selection, clear any previous selection
    if(comment.thread.comments.length > 1) {
        deleteVerdict(comment);
    }

    // if we selected more than zero, add the verdict
    if (result.length > 0){
        const text = ` ∙ ${result.join("\n\n ∙ ")}`;
        comment.contextValue = 'verdictComment';
        
        createComment("verdict", "Selected Verdicts:", {thread: comment.thread, text});
        console.log(comment);
    }

}

export async function deleteVerdict(comment: AssayComment){
    comment.contextValue = 'comment';
    comment.thread.comments = [comment.thread.comments[0]];
}