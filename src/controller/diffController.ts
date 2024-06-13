import { spawn } from "child_process";
import * as vscode from "vscode";

import { promptDiffCommand } from "../views/diffView";


export async function getDiffCommand() {
  const config = vscode.workspace.getConfiguration("assay");
  const diffCommand =
    config.get<string>("diffTool") || (await setDiffCommand(config));
  return diffCommand;
}

export async function setDiffCommand(config: vscode.WorkspaceConfiguration) {
  try{
    const input = promptDiffCommand();
    await config.update("diffTool", input, true);
    return input;
  }
  catch{
    console.error("No diff command provided.");
    return;
  }
}

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
