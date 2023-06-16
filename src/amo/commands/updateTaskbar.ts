import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

import constants from "../../config/config";

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
  const doc = activeEditor.document;
  const filePath = doc.uri.fsPath;
  const rootFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!rootFolder) {
    return;
  }

  const relativePath = filePath.replace(rootFolder, "");
  const [guid, version] = relativePath.split(path.sep).splice(1);
  if (!guid || !version) {
    return;
  }

  const reviewUrl = `${constants.reviewBaseURL}${guid}`;

  const AbortController =
    globalThis.AbortController || (await import("abort-controller"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(reviewUrl, { signal: controller.signal });
    if (response.status !== 200) {
      throw new Error("Request failed. Status: " + response.status);
    }
  } catch (error) {
    console.error(error);
    return;
  } finally {
    clearTimeout(timeout);
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
