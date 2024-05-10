import * as vscode from "vscode";

import AssayComment from "../class/comment";
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

    if (result && result.length > 0 && comment.thread){
        const text = ` ∙ ${result.join("\n\n ∙ ")}`;
        comment.contextValue = 'verdictComment';
        createComment("Selected Verdicts:", {thread: comment.thread, text}, "verdict");
    }

}

export async function clearVerdict(comment: AssayComment){
    if(comment.thread){
        comment.contextValue = 'comment';
        comment.thread.comments = [comment.thread.comments[0]];
    }
}