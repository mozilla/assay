import * as vscode from "vscode";

export default async function getDeleteCommentsPreference() {
  const config = vscode.workspace.getConfiguration("assay");
  const savedPreference =
    config.get<string>("deleteCommentsOnExport") || "No Preference";

  if (["Yes", "No"].includes(savedPreference)) {
    return savedPreference === "Yes";
  } else {
    // No preference or ask every time.
    return await promptdeleteComments(config, savedPreference);
  }
}

async function promptdeleteComments(
  config: vscode.WorkspaceConfiguration,
  savedPreference: string
) {
  const selectedPreference = await vscode.window.showQuickPick(["Yes", "No"], {
    title: "Delete version comments after exporting?",
    ignoreFocusOut: true,
  });

  if (!selectedPreference) {
    return false;
  }

  // Ask to save preference.
  if (savedPreference === "No Preference") {
    await setdeleteCommentsPreference(config, selectedPreference);
  }

  return selectedPreference === "Yes";
}

async function setdeleteCommentsPreference(
  config: vscode.WorkspaceConfiguration,
  selectedPreference: string
) {
  const input = await vscode.window.showQuickPick(
    ["Save my Preference", "Ask Every Time"],
    {
      title:
        selectedPreference === "Yes"
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
    input === "Save my Preference" ? selectedPreference : "Ask Every Time",
    true
  );
}
