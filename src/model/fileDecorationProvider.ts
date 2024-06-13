import * as fs from "fs";
import * as vscode from "vscode";
import { Event } from "vscode";

import { getFromCache } from "./cache";
import { splitUri } from "../utils/helper";

export async function fileHasComment(uri: vscode.Uri) {
  const { guid, version, filepath } = await splitUri(uri);
  const comments = await getFromCache("comments");
  if (comments?.[guid]?.[version]?.[filepath]) {
    return true;
  }
  return false;
}
export class CustomFileDecorationProvider
  implements vscode.FileDecorationProvider
{
  private _onDidChangeFileDecorations: vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  > = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations: Event<vscode.Uri | vscode.Uri[]> =
    this._onDidChangeFileDecorations.event;

  async provideFileDecoration(uri: vscode.Uri) {
    // if its a file and has a comment, return the decoration
    if (fs.lstatSync(uri.fsPath).isFile() && (await fileHasComment(uri))) {
      return {
        badge: "✎",
        color: new vscode.ThemeColor("charts.green"),
        propagate: true,
      };
    }
  }

  updateDecorations(uri: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }
}
