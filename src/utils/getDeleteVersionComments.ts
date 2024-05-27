import * as vscode from "vscode";

export async function getDeleteVersionCommentsPreference() {
  const config = vscode.workspace.getConfiguration("assay");
  const savedPreference =
    config.get<string>("deleteVersionCommentsOnExport") || "No Preference";
  return ["Yes", "No"].includes(savedPreference)
    ? savedPreference === "Yes"
    : await promptDeleteVersionComments(config, savedPreference);
}

async function promptDeleteVersionComments(
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
    await setDeleteVersionCommentsPreference(config, selectedPreference);
  }
  return selectedPreference === "Yes";
}

async function setDeleteVersionCommentsPreference(
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
    "deleteVersionCommentsOnExport",
    input === "Save my Preference" ? selectedPreference : "Ask Every Time",
    true
  );
}
