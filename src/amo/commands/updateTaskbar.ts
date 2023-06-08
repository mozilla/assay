import * as path from "path";
import * as vscode from "vscode";

import { addonInfoFromCache } from "../utils/addonCache";

export const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar(storagePath: string) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return 0;
  }
  const doc = activeEditor.document;
  const path = doc.uri.fsPath;
  const rootFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!rootFolder) {
    return 1;
  }

  const relativePath = filePath.replace(rootFolder, "");
  const relativePathParts = relativePath.split(path.sep);

  let guid: string | undefined;

  const cachePath = path.join(storagePath, ".cache");
  const cacheFiles = await vscode.workspace.fs.readDirectory(
    vscode.Uri.file(cachePath)
  );
  const cacheFileNames = cacheFiles.map((file) => file[0]);

  // find the guid, cache is stored as guid.json
  for (const part of relativePathParts) {
    console.log("Part: ", `${part}.json`);
    if (cacheFileNames.includes(`${part}.json`)) {
      guid = part;
      break;
    }
  }

  if (!guid) {
    statusBarItem.hide();
    return;
  }

  const reviewUrl = await addonInfoFromCache(storagePath, guid, "reviewUrl");

  statusBarItem.text = `${guid} - Review Page`;
  statusBarItem.tooltip = reviewUrl;
  statusBarItem.command = {
    command: "assay.review",
    arguments: [reviewUrl],
    title: "Review",
  };

  statusBarItem.show();
}
