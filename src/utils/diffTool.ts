import * as vscode from "vscode";

export async function setDiffCommand(config: vscode.WorkspaceConfiguration) {
  const input = await vscode.window.showInputBox({
    prompt: "Please enter your diff tool command (e.g. diff -rq).",
  });
  if (!input) {
    return;
  }
  await config.update("diffTool", input, true);
  return input;
}

export async function getDiffCommand() {
  const config = vscode.workspace.getConfiguration("assay");
  const diffCommand =
    config.get<string>("diffTool") || (await setDiffCommand(config));
  return diffCommand;
}
