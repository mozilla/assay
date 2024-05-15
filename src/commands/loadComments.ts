import * as vscode from "vscode";

import { getFileDecorator } from "../config/globals";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function loadFileDecorator() {
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

  const fileDecorator = getFileDecorator();
  fileDecorator.updateDecorations(doc.uri);
}
