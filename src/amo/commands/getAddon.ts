import * as vscode from "vscode";
import * as fs from "fs";

import { AddonInfoResponse } from "../interfaces";
import { getVersionChoice } from "../utils/addonVersions";
import { getAddonInfo } from "../utils/addonInfo";
import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";

export async function downloadAndExtract() {
  const input: string | undefined = await vscode.window.showInputBox({
    prompt: "Enter Addon Slug, GUID, or URL",
    title: "Assay",
  });

  if (!input) {
    return;
  }
  if (!input) {
    return;
  }

  // Retrieve version
  const versionInfo = await getVersionChoice(input);
  if (!versionInfo) {
    return;
  }
  // Retrieve version
  const versionInfo = await getVersionChoice(input);
  if (!versionInfo) {
    return;
  }

  // Retrieve metadata
  const json: AddonInfoResponse = await getAddonInfo(input);
  if (!json) {
    vscode.window.showErrorMessage("Cannot retrieve addon metadata");
    return;
  }
  // Retrieve metadata
  const json: AddonInfoResponse = await getAddonInfo(input);
  if (!json) {
    vscode.window.showErrorMessage("Cannot retrieve addon metadata");
    return;
  }

  const addonFileId = versionInfo.fileID;
  const addonName = json.name[json.default_locale];
  const addonSlug = json.slug;
  const addonVersion = versionInfo.version;
  const reviewUrl = json.review_url;
  const addonGUID = json.guid[0] === "{" ? json.guid.slice(1, -1) : json.guid;
  const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
  const compressedFilePath =
    workspaceFolder + "/" + addonGUID + "_" + addonVersion + ".xpi";

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
        workspaceFolder,
        addonGUID,
        addonVersion
      );
    }
  );

  if (!fs.existsSync(workspaceFolder + "/" + addonGUID + "/" + addonVersion)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }
}
