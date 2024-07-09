import * as vscode from "vscode";

export class RootView {
  static async selectRootFolder() {
    const options: vscode.OpenDialogOptions = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Select Addon Review Workspace",
    };

    let selectedFolders: vscode.Uri[] | undefined;
    const selectButton = { title: "Select Addon Root Folder", isCloseAffordance: true };
    await vscode.window.showInformationMessage("Assay: No root directory found.", { detail: "Select the folder where add-ons should be installed.", modal: true }, selectButton).then(async () => {
      selectedFolders = await vscode.window.showOpenDialog(options);
    });
    
    if (selectedFolders && selectedFolders.length > 0) {
      return selectedFolders[0].fsPath;
    }
  }
}
