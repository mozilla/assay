import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

import constants from "../../config/config";

const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const doc = activeEditor.document;
  if (doc.uri.scheme !== "file") {
    return;
  }

  const filePath = doc.uri.fsPath;
  const rootFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!rootFolder) {
    return;
  }

  const relativePath = filePath.replace(rootFolder, "");
  const [guid, version] = relativePath.split(path.sep).splice(-2);
  if (!guid || !version) {
    return;
  }

  const reviewUrl = `${constants.reviewBaseURL}${guid}`;
  try {
    const response = await Promise.race([
      fetch(reviewUrl),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 2000)
      ) as Promise<Response>,
    ]);

    if (response.status === 404) {
      // not a review page
      return;
    } else if (response.status === 403) {
      // not authed
      return;
    } else if (response.status !== 200) {
      // other errors
      return;
    }
  } catch (error) {
    // timed out
    console.error(error);
    return;
  }

  statusBarItem.text = `${guid} ${version}`;
  statusBarItem.tooltip = reviewUrl;
  statusBarItem.command = {
    command: "assay.review",
    arguments: [reviewUrl],
    title: "Review",
  };

  statusBarItem.show();
}
