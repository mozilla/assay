import * as vscode from "vscode";

import { commentDecoration } from "../config/globals";
import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function loadFileComments() {
  // get the current file path
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const doc = editor.document;
  const fullPath = doc.uri.fsPath;

  // get the relative path using the root folder
  const rootFolder = await getRootFolderPath();
  if (!fullPath.startsWith(rootFolder)) {
    throw new Error("File is not in the root folder");
  }

  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];
  const filepath = relativePath.split(version)[1];

  // get the comments from the cache
  const comments = await getFromCache(guid, [version, filepath]);
  if (!comments) {
    return;
  }

  // set the decorations on each line number
  const decorations: vscode.DecorationOptions[] = [];
  for (const lineNumber in comments) {
    const line = +lineNumber - 1;
    const comment = comments[lineNumber];
    const range = new vscode.Range(line, 0, line, 0);
    if (comment) {
      decorations.push({ range, hoverMessage: comment });
    }
  }
  editor.setDecorations(commentDecoration, decorations);
}
