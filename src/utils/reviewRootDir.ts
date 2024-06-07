import * as fs from "fs";
import * as vscode from "vscode";

import { filesReadonlyIncludeConfig } from "../types";

let cachedRootFolder: string | undefined;

export function setCachedRootFolder(filepath: string | undefined) {
  cachedRootFolder = filepath;
}

export async function getRootFolderPath() {
  const config = vscode.workspace.getConfiguration("assay");
  const rootFolder = config.get<string>("rootFolder");

  // check if the folder still exists. if it doesn't, prompt the user to select a new one
  // TODO: very sudden. do a prompt before it first
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

async function storeRootFolderSetting(rootFolder: string) {
  const config = vscode.workspace.getConfiguration("assay");
  await config.update(
    "rootFolder",
    rootFolder,
    vscode.ConfigurationTarget.Global
  );
}

// whenever rootFolder or readonlyInclude is modified, ensure that 1) the old root folder is removed from readonly, and 2) the new one is added.
export async function handleRootConfigurationChange(
  event: vscode.ConfigurationChangeEvent
) {
  if (
    event.affectsConfiguration("assay.rootFolder") ||
    event.affectsConfiguration("files.readonlyInclude")
  ) {
    await setRootToReadonly();
  }
}


export async function setRootToReadonly() {
  const config = vscode.workspace.getConfiguration("assay");
  const rootFolder = config.get<string>("rootFolder");

  const fileConfig = vscode.workspace.getConfiguration("files");
  const readOnlyFiles = fileConfig.get("readonlyInclude") as filesReadonlyIncludeConfig;

  // remove the cachedRootFolder's readonly property.
  const globInitialFolder = `${cachedRootFolder}/**`;
  if (globInitialFolder in readOnlyFiles) {
    readOnlyFiles[globInitialFolder] = false;
  }

  await fileConfig.update(
    "readonlyInclude",
    { ...readOnlyFiles, [`${rootFolder}/**`]: true },
    vscode.ConfigurationTarget.Global
  );

  // update the cached root folder here and on launch
  setCachedRootFolder(rootFolder);
}
