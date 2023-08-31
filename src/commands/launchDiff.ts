import * as vscode from "vscode";

import { getDiffCommand } from "../utils/diffTool";

export async function openInDiffTool(uris: [vscode.Uri, vscode.Uri]) {
  const [left, right] = uris;
  const leftUri = vscode.Uri.parse(left.toString());
  const rightUri = vscode.Uri.parse(right.toString());
  const leftPath = leftUri.fsPath;
  const rightPath = rightUri.fsPath;

  const diffCommand = await getDiffCommand();

  const terminal = vscode.window.createTerminal("External Diff Tool");
  terminal.sendText(`${diffCommand} ${leftPath} ${rightPath}`);
  terminal.show();
}
