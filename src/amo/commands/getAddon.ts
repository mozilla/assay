import * as fs from "fs";
import * as vscode from "vscode";

import { addonInfoResponse } from "../types";
import { addonInfoToCache } from "../utils/addonCache";
import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";
import {
  getRootFolderPath,
  selectRootFolder,
  storeRootFolderSetting,
} from "../utils/reviewRootDir";

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
  if (!versionInfo) {
    return;
  }

  // Retrieve metadata
  const json: addonInfoResponse = await getAddonInfo(input);
  if (!json) {
    vscode.window.showErrorMessage("Cannot retrieve addon metadata");
    return;
  }

  const addonFileId = versionInfo.fileID;
  const addonVersion = versionInfo.version;
  const addonGUID = json.guid;
  const workspaceFolder = await getRootFolderPath();
  const compressedFilePath =
    workspaceFolder + "/" + addonGUID + "_" + addonVersion + ".xpi";

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found");
    return;
  }

  // Cache
  await addonInfoToCache(storagePath, addonGUID, "reviewUrl", json.review_url);

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
    vscode.window.showErrorMessage("Cannot download addon");
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
        `${workspaceFolder}/${addonGUID}`,
        `${workspaceFolder}/${addonGUID}/${addonVersion}`
      );
    }
  );

  if (!fs.existsSync(`${workspaceFolder}/${addonGUID}/${addonVersion}`)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }
}
