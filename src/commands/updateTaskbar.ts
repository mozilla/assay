import * as path from "path";
import * as vscode from "vscode";

import { getExtensionStoragePath } from "../config/globals";
import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

export const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar() {
  const storagePath = getExtensionStoragePath();

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const doc = activeEditor.document;
  const filePath = doc.uri.fsPath;
  const rootFolder = await getRootFolderPath();
  if (!filePath.startsWith(rootFolder)) {
    statusBarItem.hide();
    throw new Error("File is not in the root folder");
  }

  const relativePath = filePath.replace(rootFolder, "");
  const guid = relativePath.split(path.sep)[1];

  if (!guid) {
    statusBarItem.hide();
    throw new Error("No guid found");
  }

  const reviewUrl = await getFromCache(storagePath, guid, "reviewUrl");

  statusBarItem.text = `${guid} - Review Page`;
  statusBarItem.tooltip = reviewUrl;
  statusBarItem.command = {
    command: "assay.review",
    arguments: [reviewUrl],
    title: "Review",
  };

  statusBarItem.show();
  return true;
}
