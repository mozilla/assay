import * as vscode from "vscode";

export async function getDeleteCommentsPreference() {
  const config = vscode.workspace.getConfiguration("assay");
  const savedPreference =
    config.get<string>("deleteCommentsOnExport") || "No Preference";
  return ["Yes", "No"].includes(savedPreference)
    ? savedPreference === "Yes"
    : await promptdeleteComments(config, savedPreference);
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
