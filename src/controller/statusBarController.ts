import * as path from "path";
import * as vscode from "vscode";

import { getRootFolderPath } from "./rootController";
import { getFromCache } from "../model/cache";
import { StatusBarView } from "../views/statusBarView";

const statusBar = new StatusBarView();

export async function updateStatusBar() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const doc = activeEditor.document;
  const filePath = doc.uri.fsPath;
  const rootFolder = await getRootFolderPath();
  if (!filePath.startsWith(rootFolder)) {
    statusBar.hide();
    throw new Error("File is not in the root folder.");
  }

  const relativePath = filePath.replace(rootFolder, "");
  const guid = relativePath.split(path.sep)[1];

  if (!guid) {
    statusBar.hide();
    throw new Error("No guid found.");
  }

  const reviewUrl = await getFromCache("reviewMeta", [guid, "review_url"]);
  statusBar.updateAndShow(guid, reviewUrl);
  return true;
}
