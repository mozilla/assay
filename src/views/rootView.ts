import * as vscode from "vscode";

// TODO: very sudden. do a prompt before it first
export async function selectRootFolder() {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select Addon Review Workspace",
  };

  const selectedFolders = await vscode.window.showOpenDialog(options);
  if (selectedFolders && selectedFolders.length > 0) {
    return selectedFolders[0].fsPath;
  }
}
