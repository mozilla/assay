import path = require("path");
import * as vscode from "vscode";

import { getFileDecorator } from "../config/globals";
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
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const doc = editor.document;
  const fullPath = doc.uri.fsPath;
  const rootFolder = await getRootFolderPath();
  if (!fullPath.startsWith(rootFolder)) {
    return;
  }

  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const keys = relativePath.split("/").slice(2);

  const fileDecorator = getFileDecorator();
  fileDecorator.updateDecorations(doc.uri);

  const comments = await getFromCache(guid, keys);
  if (!comments) {
    editor.setDecorations(commentDecoration, []);
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
