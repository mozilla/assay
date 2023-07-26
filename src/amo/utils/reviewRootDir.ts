import * as fs from "fs";
import * as vscode from "vscode";

export async function selectRootFolder() {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select Addon Review Workspace",
  };

  const selectedFolders = await vscode.window.showOpenDialog(options);
  if (selectedFolders && selectedFolders.length > 0) {
    const rootFolder = selectedFolders[0].fsPath;
    return rootFolder;
  }

  return undefined;
}

export async function storeRootFolderSetting(rootFolder: string) {
  const config = vscode.workspace.getConfiguration("assay");
  await config.update(
    "rootFolder",
    rootFolder,
    vscode.ConfigurationTarget.Global
  );
}

export async function getRootFolderPath() {
  const config = vscode.workspace.getConfiguration("assay");
  const rootFolder = config.get<string>("rootFolder");

  // check if the folder still exists. if it doesn't, prompt the user to select a new one
  if ((rootFolder && !fs.existsSync(rootFolder)) || !rootFolder) {
    const newRootFolder = await selectRootFolder();
    if (!newRootFolder) {
      throw new Error("No root folder selected");
    }
    await storeRootFolderSetting(newRootFolder);
    return newRootFolder;
  }
  return rootFolder;
}
