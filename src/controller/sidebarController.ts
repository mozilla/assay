import * as vscode from "vscode";

import { getFileDecorator } from "../config/globals";
import { splitUri } from "../utils/helper";

export async function loadFileDecorator(uri?: vscode.Uri) {
  const fileDecorator = getFileDecorator();

  if (uri) {
    fileDecorator.updateDecorations(uri);
  } else {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const doc = editor.document;
    const { fullPath, rootFolder } = await splitUri(doc.uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }
    fileDecorator.updateDecorations(doc.uri);
  }
}
