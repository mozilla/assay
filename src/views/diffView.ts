import * as vscode from "vscode";

export async function promptDiffCommand() {
  const input = await vscode.window.showInputBox({
    prompt: "Please enter your diff tool command (e.g. bcomp @script.bc).",
    ignoreFocusOut: true,
  });
  if (!input) {
    throw new Error("No diff command provided.");
  }
  return input;
}
