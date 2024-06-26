import * as vscode from "vscode";

import { addonInfoResponse } from "../types";
import { addToCache, getFromCache } from "../utils/addonCache";
import { downloadAddon } from "../utils/addonDownload";
import { extractAddon } from "../utils/addonExtract";
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function getInput(): Promise<string> {
  const input = await vscode.window.showInputBox({
    prompt: "Enter Addon Slug, GUID, or URL",
    title: "Assay",
    ignoreFocusOut: true,
  });

  if (!input) {
    throw new Error("No input provided");
  }
  return input;
}

export async function downloadAndExtract(
  urlGuid?: string,
  urlVersion?: string
) {
  try {
    const input = urlGuid || (await getInput());
    const json: addonInfoResponse = await getAddonInfo(input);

    const versionInfo = await getVersionChoice(input, urlVersion);
    const addonFileID = versionInfo.fileID;
    const version = versionInfo.version;
    const guid = json.guid;
    const addonID = json.id;

    const workspaceFolder = await getRootFolderPath();
    const compressedFilePath = `${workspaceFolder}/${guid}_${version}.xpi`;

    const existingVersions = await getFromCache("addonMeta", [guid, "file_ids"]) || {};

    existingVersions[version] = addonFileID;

    await addToCache("addonMeta", [guid], {
      review_url: json.review_url,
      file_ids: existingVersions,
      id: addonID,
    });

    await downloadAddon(addonFileID, compressedFilePath);

    await extractAddon(
      compressedFilePath,
      `${workspaceFolder}/${guid}/${version}`
    );
    return { workspaceFolder, guid, version };
  } catch (error) {
    console.error(error);
  }
}
