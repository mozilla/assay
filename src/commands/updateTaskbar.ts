import * as path from "path";
import * as vscode from "vscode";

import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";
import { splitUri } from "../utils/splitUri";

export const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar() {
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    return;
  }

  const filePath = workspace[0].uri;
  const { guid, rootFolder } = await splitUri(filePath);
  if (!filePath.fsPath.startsWith(rootFolder)) {
    statusBarItem.hide();
    throw new Error("File is not in the root folder");
  }

  if (!guid) {
    statusBarItem.hide();
    throw new Error("No guid found");
  }

  const reviewUrl = await getFromCache("reviewMeta", [guid, "review_url"]);

  console.log(reviewUrl);

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
