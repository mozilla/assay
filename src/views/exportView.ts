import * as vscode from "vscode";

import { QPOption } from "../types";


export class ExportView {

  static async getDeleteCommentsPreference() {
    const config = vscode.workspace.getConfiguration("assay");
    const savedPreference =
      (config.get<string>("deleteCommentsOnExport") as QPOption) || QPOption.None;

    if ([QPOption.Yes, QPOption.No].includes(savedPreference)) {
      return savedPreference === QPOption.Yes;
    } else {
      // No preference or ask every time.
      return await ExportView.promptdeleteComments(config, savedPreference);
    }
  }

  private static async promptdeleteComments(
    config: vscode.WorkspaceConfiguration,
    savedPreference: string
  ) {
    const selectedPreference = await vscode.window.showQuickPick(
      [QPOption.Yes, QPOption.No],
      {
        title: "Delete version comments after exporting?",
        ignoreFocusOut: true,
      }
    );

    if (!selectedPreference) {
      return false;
    }

    // Ask to save preference.
    if (savedPreference === QPOption.None) {
      await ExportView.setDeleteCommentsPreference(config, selectedPreference);
    }

    return selectedPreference === QPOption.Yes;
  }

  private static async setDeleteCommentsPreference(
    config: vscode.WorkspaceConfiguration,
    selectedPreference: string
  ) {
    const input = await vscode.window.showQuickPick(
      [QPOption.Save, QPOption.Ask],
      {
        title:
          selectedPreference === QPOption.No
            ? "Delete comments on every export?"
            : "Keep comments on every export?",
        ignoreFocusOut: true,
      }
    );

    if (!input) {
      return;
    }

    await config.update(
      "deleteCommentsOnExport",
      input === QPOption.Save ? selectedPreference : QPOption.Ask,
      true
    );
  }

}