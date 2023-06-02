import * as vscode from "vscode";
import * as fs from "fs";

import { AddonInfoResponse } from "../interfaces";
import { getVersionChoice } from "../utils/AddonVersions";
import { getAddonInfo } from "../utils/AddonInfo";
import { downloadAddon } from "../utils/AddonDownload";
import { extractAddon } from "../utils/AddonExtract";

export const downloadAndExtract = vscode.commands.registerCommand(
  "assay.get",
  async function () {
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
    const json: AddonInfoResponse = await getAddonInfo(input);
    console.log(json);
    if (!json) {
      vscode.window.showErrorMessage("No addon found");
      return;
    }

    const addonFileId = versionInfo.fileID;
    const addonName = json.name[json.default_locale];
    const addonSlug = json.slug;
    const addonVersion = versionInfo.version;
    const reviewUrl = json.review_url;
    console.log(reviewUrl);
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
          workspaceFolder,
          addonGUID,
          addonVersion
        );
      }
    );

    if (
      !fs.existsSync(workspaceFolder + "/" + addonGUID + "/" + addonVersion)
    ) {
      vscode.window.showErrorMessage("Extraction failed");
      return;
    }

    // make a status bar item in the new window
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );

    statusBarItem.text = addonGUID + " " + addonName + " " + addonVersion;
    statusBarItem.tooltip = reviewUrl;
    statusBarItem.command = {
      command: "assay.review",
      arguments: [reviewUrl],
      title: "Review",
    };

    statusBarItem.show();
  }
);
