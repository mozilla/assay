import * as vscode from "vscode";

import { splitUri } from "./splitUri";
import { getFileDecorator } from "../config/globals";

export async function loadFileDecorator() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const doc = editor.document;
  const {fullPath, rootFolder} = await splitUri(doc.uri);

  if (!fullPath.startsWith(rootFolder)) {
    return;
  }

  const fileDecorator = getFileDecorator();
  fileDecorator.updateDecorations(doc.uri);
}
