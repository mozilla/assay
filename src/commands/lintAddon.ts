import { existsSync } from 'node:fs';
import * as vscode from "vscode";

export async function lintAddon() {
  const fsInput = await vscode.window.showInputBox({
    prompt: "Enter path to Addon (local file system)",
    title: "Lint AMO Addon",
    ignoreFocusOut: true,
  });

  if (!fsInput) {
    throw new Error("lintAddon failed, no input provided!");
  }

  if (!existsSync(fsInput)) {
    throw new Error("lintAddon failed, the file path doesn't exist in local file system!");
  }

  try {
    // Fetch linting results from the server
    const lintingResults = await "http://localhost:3000?directory=${fsInput}";

    // Check if linting results are available
    if (lintingResults) {
        // Process and display linting results
        console.log(lintingResults);
        // Your logic to parse and display linting results
    } else {
        vscode.window.showErrorMessage('Error fetching linting results!');
    }
  } catch (error) {
    console.error(error);
  }
}
