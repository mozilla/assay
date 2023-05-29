import * as vscode from 'vscode';

export async function extractAddon(compressedFilePath: string, workspaceFolder: string, addonSlug: string) {
    const extract = require('extract-zip');
    extract(compressedFilePath, { dir: workspaceFolder + '/' + addonSlug }, function (err: any) {
        if (err) {
            console.log(err);
        } else {
            vscode.window.showInformationMessage('Extraction complete');
        }
    });
}