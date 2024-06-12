import * as extract from "extract-zip";
import * as fs from "fs";
import * as vscode from "vscode";

import constants from "../config/config";
import { addonInfoResponse, errorMessages } from "../types";
import { addToCache } from "../utils/addonCache";
import { makeAuthHeader } from "../utils/requestAuth";
import { getRootFolderPath } from "../utils/reviewRootDir";
import { getInput, getVersionChoice, promptOverwrite } from "../views/addonView";
import { promptProgress, showErrorMessage } from "../views/notificationView";


async function fetchDownloadFile(fileId: string) {
  const url = `${constants.downloadBaseURL}${fileId}`;
  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorMessages: errorMessages = {
      window: {
        404: `(Status ${response.status}): XPI download file not found`,
        401: `(Status ${response.status}): Unauthorized request for XPI file`,
        403: `(Status ${response.status}): Inadequate permissions for XPI file`,
        other: `(Status ${response.status}): Could not fetch XPI file`,
      },
      thrown: {
        404: "Download file not found",
        401: "Unauthorized request",
        403: "Forbidden request",
        other: "Download request failed",
      },
    };

    return await showErrorMessage(
      errorMessages,
      response.status,
      fetchDownloadFile,
      [fileId]
    );
  }
  return response;
}

/**
 * Downloads and extracts an add-on to the root folder. If no add-on is specified, prompts the user.
 * @param urlGuid GUID of the add-on.
 * @param urlVersion The version to download.
 * @returns 
 */
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

    await addToCache("reviewMeta", [guid], {
      review_url: json.review_url,
      file_id: addonFileID,
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

/**
 * Fetches version information for a given add-on.
 * @param input A string identifying a given add-on.
 * @param next 
 * @returns The version information for an add-on.
 */
export async function getAddonVersions(input: string, next?: string) {
  const slug: string = getAddonSlug(input);

  const url = next
    ? next
    : `${constants.apiBaseURL}addons/addon/${slug}/versions?filter=all_with_deleted`;

  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorMessages: errorMessages = {
      window: {
        404: next
          ? `(Status ${response.status}): "Could not fetch more versions"`
          : `(Status ${response.status}): Addon not found`,
        401: `(Status ${response.status}): Unauthorized request`,
        403: `(Status ${response.status}): Inadequate permissions`,
        other: `(Status ${response.status}): Could not fetch versions`,
      },
      thrown: {
        404: next ? "Failed to fetch versions" : "Failed to fetch addon",
        401: "Unauthorized request",
        403: "Forbidden request",
        other: "Failed to fetch versions",
      },
    };

    return await showErrorMessage(
      errorMessages,
      response.status,
      getAddonVersions,
      [input, next]
    );
  }
  const json = await response.json();
  return json;
}

/**
 * Fetches the information about a given add-on.
 * @param input A string identifying a given addon.
 * @returns The addon information.
 */
async function getAddonInfo(input: string): Promise<addonInfoResponse> {
  const slug: string = getAddonSlug(input);
  const url = `${constants.apiBaseURL}addons/addon/${slug}`;
  const headers = await makeAuthHeader();

  const response = await fetch(url, { headers: headers });
  if (!response.ok) {
    const errorMessages: errorMessages = {
      window: {
        404: `(Status ${response.status}): Addon not found`,
        401: `(Status ${response.status}): Unauthorized request`,
        403: `(Status ${response.status}): Inadequate permissions`,
        other: `(Status ${response.status}): Could not fetch addon info`,
      },
      thrown: {
        404: "Failed to fetch addon info",
        401: "Unauthorized request",
        403: "Forbidden request",
        other: "Failed to fetch addon info",
      },
    };

    return await showErrorMessage(
      errorMessages,
      response.status,
      getAddonInfo,
      [input]
    );
  }
  const json = await response.json();
  return json;
}

/**
 * Fetches and downloads the add-on to path.
 * @param fileId The fileId of the add-on's xpi
 * @param path The path to save the add-on to.
 */
async function downloadAddon(fileId: string, path: string) {

  promptProgress("Downloading Addon", async () => {
      const response = await fetchDownloadFile(fileId);
      const dest = fs.createWriteStream(path, { flags: "w" });
      dest.write(await response.buffer());
      dest.close();

      if (!fs.existsSync(path)) {
        const errorMessages: errorMessages = {
          window: {
              other: `Could not download addon to ${path}`,
          },
          thrown: {
              other: "Download failed",
          },
        };

        await showErrorMessage(errorMessages, "other", downloadAddon, [
            fileId,
            path,
        ]);
      }
    });
}

/**
 * Extracts the add-on xpi into its version folder in the root add-ons directory.
 * @param compressedFilePath The location of the xpi.
 * @param addonVersionFolderPath The location to store the add-on version.
 */
async function extractAddon(
  compressedFilePath: string,
  addonVersionFolderPath: string
) {
  // if the directory exists, ask to overwrite.
  if (!(await dirExistsOrMake(addonVersionFolderPath))) {
    try{
      await promptOverwrite();
    }
    catch{
      await fs.promises.unlink(compressedFilePath);
      return;
    }
  }

  await extract(compressedFilePath, {
    dir: addonVersionFolderPath,
  });

  await fs.promises.unlink(compressedFilePath);

  if (!fs.existsSync(addonVersionFolderPath)) {
    const errorMessages: errorMessages = {
      window: {
        other: `Extraction failed. Could not find ${addonVersionFolderPath}.`,
      },
      thrown: {
        other: "Extraction failed.",
      },
    };

    return await showErrorMessage(errorMessages, "other", extractAddon, [
      compressedFilePath,
      addonVersionFolderPath,
    ]);
  }

  vscode.window.showInformationMessage("Extraction complete.");
}

/**
 * Creates a directory at location dir.
 * @param dir The directory to create.
 * @returns Whether the directory was created.
 */
async function dirExistsOrMake(dir: string) {
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
    return true;
  }
  return false;
}

/**
 * Cleans the input so as to leave only the slug.
 * @param input The input to clean.
 * @returns The add-on slug.
 */
function getAddonSlug(input: string) {
  const delimiter = input.includes("review/")
    ? "review/"
    : input.includes("review-unlisted/")
    ? "review-unlisted/"
    : "addon/";

  return input.includes("/") ? input.split(delimiter)[1]?.split("/")[0] : input;
}