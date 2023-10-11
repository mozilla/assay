import * as vscode from "vscode";
import { Event } from "vscode";

import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

async function hasComment(uri: vscode.Uri) {
  if (uri.scheme !== "file") {
    return false;
  }
  const fullpath = uri.fsPath;
  const rootFolder = await getRootFolderPath();

  const filepath = fullpath.replace(rootFolder, "");
  const guid = filepath.split("/")[1];
  const version = filepath.split("/")[2];
  const file = filepath.split(version)[1];

  const comments = await getFromCache(guid, [version, file]);
  if (comments) {
    return true;
  }
}

export class CustomFileDecorationProvider {
  private _onDidChangeFileDecorations: vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  > = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations: Event<vscode.Uri | vscode.Uri[]> =
    this._onDidChangeFileDecorations.event;
  private _folderCommentPaths: Set<string> = new Set();

  async provideFileDecoration(uri: vscode.Uri) {
    // if its a file and has a comment, return the decoration
    // Also if it's a folder of a file that has a comment, return the decoration
    if ((await hasComment(uri)) || this._folderCommentPaths.has(uri.fsPath)) {
      // update the decoration of the parent folder
      const parentFolder = uri.with({
        path: uri.path.split("/").slice(0, -1).join("/"),
      });
      if (parentFolder.fsPath !== (await getRootFolderPath())) {
        this.updateDecorations(parentFolder);
      }

      return {
        badge: "C",
        color: new vscode.ThemeColor("charts.green"),
      };
    }
  }

  updateDecorations(uri: vscode.Uri) {
    this._folderCommentPaths.add(uri.fsPath); // maybe a better way to do this?
    this._onDidChangeFileDecorations.fire(uri);
  }
}
