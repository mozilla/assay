import { spawn } from "child_process";
import * as vscode from "vscode";

import { getDiffCommand } from "../utils/diffTool";

export async function openInDiffTool(uris: [vscode.Uri, vscode.Uri]) {
  const [left, right] = uris;
  const leftUri = vscode.Uri.parse(left.toString());
  const rightUri = vscode.Uri.parse(right.toString());
  const leftPath = leftUri.fsPath;
  const rightPath = rightUri.fsPath;

  const diffCommand = await getDiffCommand();
  if (!diffCommand) {
    return;
  }

  const diffProcess = spawn(diffCommand, [leftPath, rightPath]);
  diffProcess.on("error", (err) => {
    vscode.window.showErrorMessage(
      `External Diff Tool failed to launch: ${err.message}`
    );
    return;
  });
  return true;
}
