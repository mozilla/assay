import { spawn } from "child_process";
import * as vscode from "vscode";

import { DiffView } from "../views/diffView";

export class DiffController {
  /**
   * Launches the external diff tool.
   * @param uris The files to compare.
   * @returns Whether the diff tool successfully launched.
   */
  async openInDiffTool(uris: [vscode.Uri, vscode.Uri]) {
    const [left, right] = uris;
    const leftUri = vscode.Uri.parse(left.toString());
    const rightUri = vscode.Uri.parse(right.toString());
    const leftPath = leftUri.fsPath;
    const rightPath = rightUri.fsPath;

    const diffCommand = await this.getDiffCommand();
    if (!diffCommand) {
      return false;
    }

    const diffProcess = spawn(diffCommand, [leftPath, rightPath]);
    diffProcess.on("error", (err) => {
      vscode.window.showErrorMessage(
        `External Diff Tool failed to launch: ${err.message}`
      );
      return false;
    });
    return true;
  }

  /**
   * Fetches the diff command stored in config.
   * @returns The diff command, if defined.
   */
  private async getDiffCommand() {
    const config = vscode.workspace.getConfiguration("assay");
    const diffCommand =
      config.get<string>("diffTool") || (await this.setDiffCommand());
    return diffCommand;
  }

  /**
   * Prompts the user for a diff command and updates config.
   * @returns the saved diff command, if any
   */
  private async setDiffCommand() {
    try {
      const input = DiffView.promptDiffCommand();
      const config = vscode.workspace.getConfiguration("assay");
      await config.update("diffTool", input, true);
      return input;
    } catch {
      console.error("No diff command provided.");
      return undefined;
    }
  }
}
