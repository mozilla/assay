import * as fs from "fs";
import * as vscode from "vscode";
import { Event } from "vscode";

import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function fileHasComment(uri: vscode.Uri) {
  const fullpath = uri.fsPath;
  const rootFolder = await getRootFolderPath();

  const filepath = fullpath.replace(rootFolder, "");
  const splitPath = filepath.split("/");
  const guid = splitPath[1];
  const keys = splitPath.slice(2);

  const comments = await getFromCache(guid, keys);
  // check if comments map is empty or not defined
  if (!comments || Object.keys(comments).length === 0) {
    console.log("returning false");
    return false;
  }
  return true;
}

export async function folderHasComment(uri: vscode.Uri) {
  const fullpath = uri.fsPath;
  const rootFolder = await getRootFolderPath();

  const filepath = fullpath.replace(rootFolder, "");
  const splitPath = filepath.split("/");
  const guid = splitPath[1];
  const keys = splitPath.slice(2);

  // if there no keys, then we are at the guid path. return false
  if (keys.length === 0) {
    return false;
  }

  const comments = await getFromCache(guid, keys);
  // check if comments map is empty or not defined
  if (!comments || Object.keys(comments).length === 0) {
    return false;
  }
  return true;
}

export class CustomFileDecorationProvider {
  private _onDidChangeFileDecorations: vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  > = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations: Event<vscode.Uri | vscode.Uri[]> =
    this._onDidChangeFileDecorations.event;

  async provideFileDecoration(uri: vscode.Uri) {
    // if its a file and has a comment, return the decoration
    // Also if it's a folder of a file that has a comment, return the decoration

    // go up the parent folders until the root too
    const parentFolder = uri.with({
      path: uri.path.split("/").slice(0, -1).join("/"),
    });
    if (parentFolder.fsPath !== (await getRootFolderPath())) {
      this.updateDecorations(parentFolder);
    }

    if (
      (fs.lstatSync(uri.fsPath).isFile() && (await fileHasComment(uri))) ||
      (fs.lstatSync(uri.fsPath).isDirectory() && (await folderHasComment(uri)))
    ) {
      return {
        badge: "C",
        color: new vscode.ThemeColor("charts.green"),
      };
    }
  }

  updateDecorations(uri: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }
}
