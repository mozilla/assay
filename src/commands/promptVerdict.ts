import * as vscode from "vscode";

import AssayComment from "../class/comment";
import createComment from "../utils/createComment";


export async function selectVerdict(comment: AssayComment) {

    if (!comment.thread){
        return;
    }

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
        return;
    }

    // if there exists a selection, clear any previous selection
    if(comment.thread.comments.length > 1) {
        changeVerdict(comment);
    }

    // if we selected more than zero, add the verdict
    if (result.length > 0){
        const text = ` ∙ ${result.join("\n\n ∙ ")}`;
        comment.contextValue = 'verdictComment';
        
        createComment("Selected Verdicts:", {thread: comment.thread, text}, "verdict");
        console.log(comment);
    }

}

export async function changeVerdict(comment: AssayComment){
    if(comment.thread){
        comment.contextValue = 'comment';
        comment.thread.comments = [comment.thread.comments[0]];
    }
}