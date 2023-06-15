import * as fs from "fs";
import * as vscode from "vscode";

import { addonInfoResponse } from "../types";
import { addonInfoToCache } from "../utils/addonCache";
import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";

export function getAddonFolderPaths(
  guid: string,
  version: string,
  workspaceFolder: string
) {
  const addonFolderPath = `${workspaceFolder}/${guid}`;
  const addonVersionFolderPath = `${addonFolderPath}/${version}`;
  return { addonFolderPath, addonVersionFolderPath };
}

export async function downloadAndExtract(storagePath: string) {
  const input: string | undefined = await vscode.window.showInputBox({
    prompt: "Enter Addon Slug, GUID, or URL",
    title: "Assay",
  });

  if (!input) {
    return;
  }

  // Retrieve version
  const versionInfo = await getVersionChoice(input);
  // TODO: handle errors
  if (!versionInfo) {
    return;
  }

  // Retrieve metadata
  const json: addonInfoResponse = await getAddonInfo(input);
  console.log(json);
  if (!json) {
    vscode.window.showErrorMessage("No addon found");
    return;
  }

  const addonFileId = versionInfo.fileID;
  const addonVersion = versionInfo.version;
  const addonGUID = json.guid;
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  const addonReviewURL = json.review_url;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found");
    return;
  }

  const compressedFilePath = `${workspaceFolder}/${addonGUID}_${addonVersion}.xpi`;
  const { addonFolderPath, addonVersionFolderPath } = getAddonFolderPaths(
    addonGUID,
    addonVersion,
    workspaceFolder
  );

  // Cache
  await addonInfoToCache(storagePath, addonGUID, "reviewUrl", addonReviewURL);

  // Download
  await vscode.window.withProgress(
    { title: "Assay", location: vscode.ProgressLocation.Notification },
    async function (progress) {
      progress.report({
        message: "Downloading " + input,
      });

      await downloadAddon(addonFileId, compressedFilePath);
    }
  );

  if (!fs.existsSync(compressedFilePath)) {
    vscode.window.showErrorMessage("Download failed");
    return;
  }

  // Extract
  vscode.window.withProgress(
    { title: "Assay", location: vscode.ProgressLocation.Notification },
    async function (progress) {
      progress.report({
        message: "Extracting",
      });

      await extractAddon(
        compressedFilePath,
        addonFolderPath,
        addonVersionFolderPath
      );
    }
  );

  if (!fs.existsSync(addonVersionFolderPath)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }
}
