import * as path from "path";
import * as vscode from "vscode";

import { getFromCache } from "../utils/addonCache";
import { splitUri } from "../utils/splitUri";

export const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const filePath = activeEditor.document.uri;
  const { guid, rootFolder } = await splitUri(filePath);

  // in comment mode. still in the same file, just not in editor itself
  if(guid === "mozilla.assay"){
    return;
  }

  if (!filePath.fsPath.startsWith(rootFolder)) {
    statusBarItem.hide();
    throw new Error("File is not in the root folder");
  }

  if (!guid) {
    statusBarItem.hide();
    throw new Error("No guid found");
  }

  const reviewUrl = await getFromCache("reviewUrls", ["guid"]);

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
