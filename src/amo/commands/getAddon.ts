import * as vscode from "vscode";

import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";

export async function getInput(): Promise<string> {
  const input = await vscode.window.showInputBox({
    prompt: "Enter Addon Slug, GUID, or URL",
    title: "Assay",
  });

  if (!input) {
    throw new Error("No input provided");
  }
  return input;
}

export function getWorkspaceFolder(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found");
    throw new Error("No workspace folder found");
  }
  return workspaceFolder;
}

export async function downloadAndExtract() {
  try {
    const input = await getInput();

    const versionInfo = await getVersionChoice(input);
    const addonFileId = versionInfo.fileID;
    const addonVersion = versionInfo.version;

    const json = await getAddonInfo(input);
    const addonGUID = json.guid;

    const workspaceFolder = getWorkspaceFolder();
    const compressedFilePath = `${workspaceFolder}/${addonGUID}_${addonVersion}.xpi`;

    await downloadAddon(addonFileId, compressedFilePath);
    await extractAddon(
      compressedFilePath,
      `${workspaceFolder}/${addonGUID}`,
      `${workspaceFolder}/${addonGUID}/${addonVersion}`
    );
  } catch (error) {
    console.error(error);
  }
}
