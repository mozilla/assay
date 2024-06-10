import * as vscode from "vscode";

import { ExportPreference } from "../types";

export default async function getDeleteCommentsPreference() {
  const config = vscode.workspace.getConfiguration("assay");
  const savedPreference =
    config.get<string>("deleteCommentsOnExport") as ExportPreference || ExportPreference.None;

  if ([ExportPreference.Yes, ExportPreference.No].includes(savedPreference)) {
    return savedPreference === ExportPreference.Yes;
  } else {
    // No preference or ask every time.
    return await promptdeleteComments(config, savedPreference);
  }
}

async function promptdeleteComments(
  config: vscode.WorkspaceConfiguration,
  savedPreference: string
) {
  const selectedPreference = await vscode.window.showQuickPick([ExportPreference.Yes, ExportPreference.No], {
    title: "Delete version comments after exporting?",
    ignoreFocusOut: true,
  });

  if (!selectedPreference) {
    return false;
  }

  // Ask to save preference.
  if (savedPreference ===  ExportPreference.None) {
    await setDeleteCommentsPreference(config, selectedPreference);
  }

  return selectedPreference === ExportPreference.Yes;
}

async function setDeleteCommentsPreference(
  config: vscode.WorkspaceConfiguration,
  selectedPreference: string
) {
  const input = await vscode.window.showQuickPick(
    [ExportPreference.Save, ExportPreference.Ask],
    {
      title:
        selectedPreference === ExportPreference.No
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
    input === ExportPreference.Save ? selectedPreference : ExportPreference.Ask,
    true
  );
}
