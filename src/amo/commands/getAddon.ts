import * as fs from "fs";
import * as vscode from "vscode";

import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";

export function getInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    vscode.window
      .showInputBox({
        prompt: "Enter Addon Slug, GUID, or URL",
        title: "Assay",
      })
      .then((input) => {
        if (!input) {
          reject(new Error("No input provided"));
        } else {
          resolve(input);
        }
      });
  });
}

export async function downloadAndExtract() {
  try {
    const input = await getInput();

    const versionInfo = await getVersionChoice(input);
    const addonFileId = versionInfo.fileID;
    const addonVersion = versionInfo.version;

    const json = await getAddonInfo(input);
    const addonGUID = json.guid;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder found");
      throw new Error("No workspace folder found");
    }
    const compressedFilePath = `${workspaceFolder}/${addonGUID}_${addonVersion}.zip`;

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
