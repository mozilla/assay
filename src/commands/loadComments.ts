import path = require("path");
import * as vscode from "vscode";

import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

const commentDecoration: vscode.TextEditorDecorationType =
  vscode.window.createTextEditorDecorationType({
    gutterIconPath: vscode.Uri.file(
      path.join(__dirname, "..", "media", "comment.svg")
    ),
    gutterIconSize: "contain",
  });

export async function loadFileComments() {
  // get the current file path
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const doc = editor.document;
  const fullPath = doc.uri.fsPath;
  const rootFolder = await getRootFolderPath();
  if (!fullPath.startsWith(rootFolder)) {
    throw new Error("File is not in the root folder");
  }

  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];
  const filepath = relativePath.split(version)[1];

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
