import * as vscode from "vscode";

import { QuickPick } from "../types";

export default async function getDeleteCommentsPreference() {
  const config = vscode.workspace.getConfiguration("assay");
  const savedPreference =
    (config.get<string>("deleteCommentsOnExport") as QuickPick) ||
    QuickPick.None;

  if ([QuickPick.Yes, QuickPick.No].includes(savedPreference)) {
    return savedPreference === QuickPick.Yes;
  } else {
    // No preference or ask every time.
    return await promptdeleteComments(config, savedPreference);
  }
}

async function promptdeleteComments(
  config: vscode.WorkspaceConfiguration,
  savedPreference: string
) {
  const selectedPreference = await vscode.window.showQuickPick(
    [QuickPick.Yes, QuickPick.No],
    {
      title: "Delete version comments after exporting?",
      ignoreFocusOut: true,
    }
  );

  if (!selectedPreference) {
    return false;
  }

  // Ask to save preference.
  if (savedPreference === QuickPick.None) {
    await setDeleteCommentsPreference(config, selectedPreference);
  }

  return selectedPreference === QuickPick.Yes;
}

async function setDeleteCommentsPreference(
  config: vscode.WorkspaceConfiguration,
  selectedPreference: string
) {
  const input = await vscode.window.showQuickPick(
    [QuickPick.Save, QuickPick.Ask],
    {
      title:
        selectedPreference === QuickPick.No
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
    input === QuickPick.Save ? selectedPreference : QuickPick.Ask,
    true
  );
}
