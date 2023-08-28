import * as vscode from "vscode";

import { addonInfoResponse } from "../types";
import { addToCache } from "../utils/addonCache";
import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";
import { getRootFolderPath } from "../utils/reviewRootDir";

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

export async function downloadAndExtract() {
  try {
    const input = await getInput();

    const json: addonInfoResponse = await getAddonInfo(input);

    const versionInfo = await getVersionChoice(input);
    const addonFileId = versionInfo.fileID;
    const addonVersion = versionInfo.version;
    const addonGUID = json.guid;

    const workspaceFolder = await getRootFolderPath();
    const compressedFilePath = `${workspaceFolder}/${addonGUID}_${addonVersion}.xpi`;

    await addToCache(addonGUID, "reviewUrl", json.review_url);

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
