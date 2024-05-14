import * as vscode from "vscode";

import { exportCommentsFromFile } from "./exportComments";

export async function exportComment() {

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

    await exportCommentsFromFile();

}