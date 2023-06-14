import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

import constants from "../../config/config";

const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "Assay";

export async function updateTaskbar(storagePath: string) {
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
  const relativePathParts = relativePath.split(path.sep);

  let guid: string | undefined;
  let reviewUrl: string | undefined;

  const cachePath = path.join(storagePath, ".cache");
  const cacheFiles = await vscode.workspace.fs.readDirectory(
    vscode.Uri.file(cachePath)
  );

  console.log("Cache Path: ", cachePath);
  console.log("Cache Files: ", cacheFiles);
  const cacheFileNames = cacheFiles.map((file) => file[0]);

  // cache file names are guids that store data about the addon. Find the file and get the reviewURL
  for (const part of relativePathParts) {
    console.log("Part: ", `${part}.json`);
    if (cacheFileNames.includes(`${part}.json`)) {
      guid = part;
      const cacheFile = await vscode.workspace.fs.readFile(
        vscode.Uri.file(`${cachePath}/${part}.json`)
      );
      const cacheFileJSON = JSON.parse(cacheFile.toString());
      reviewUrl = cacheFileJSON.reviewURL;
      break;
    }
  }

  if (!guid) {
    statusBarItem.hide();
    return;
  }

  statusBarItem.text = `${guid} - Review Page`;
  statusBarItem.tooltip = reviewUrl;
  statusBarItem.command = {
    command: "assay.review",
    arguments: [reviewUrl],
    title: "Review",
  };

  statusBarItem.show();
}
