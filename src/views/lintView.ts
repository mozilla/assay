import * as vscode from "vscode";

export class LintView {
  /**
   * Warn the user that saving will remove the lints.
   */
  static async warnOnSave() {
    await vscode.window.showInformationMessage(
      "(Assay) Version modified. Lints cleared."
    );
  }
}
