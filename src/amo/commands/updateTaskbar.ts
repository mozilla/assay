import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { addonInfoFromCache } from "../utils/addonCache";

export const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function findGuidInCache(
  storagePath: string,
  pathParts: string[]
) {
  const cachePath = path.join(storagePath, ".cache");
  if (!fs.existsSync(cachePath)) {
    throw new Error(`No cache found at ${cachePath}`);
  }
  const cacheFiles = fs.readdirSync(cachePath);
  console.log("\n\n\ncacheFiles ", cacheFiles);

  // find the guid, cache is stored as guid.json
  for (const part of pathParts) {
    if (cacheFiles.includes(`${part}`)) {
      return part;
    }
  }
}

export async function updateTaskbar(storagePath: string) {
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
  const relativePathParts = relativePath.split(path.sep);
  const guid: string | undefined = await findGuidInCache(
    storagePath,
    relativePathParts
  );

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
