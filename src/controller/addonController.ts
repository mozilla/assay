import * as extract from "extract-zip";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

import { AddonCacheController } from "./addonCacheController";
import { CredentialController } from "./credentialController";
import { DirectoryController } from "./directoryController";
import { SidebarController } from "./sidebarController";
import constants from "../config/config";
import { AddonInfoResponse, AddonVersion, ErrorMessages } from "../types";
import { AddonView } from "../views/addonView";
import { NotificationView } from "../views/notificationView";

export class AddonController {
  constructor(
    private credentialController: CredentialController,
    private addonCacheController: AddonCacheController,
    private directoryController: DirectoryController,
    private sidebarController: SidebarController
  ) {}

  /**
   * Fetches version information for a given add-on.
   * @param input A string identifying a given add-on.
   * @param next the URL of the next batch of add-ons, if any
   * @returns The version information for an add-on.
   */
  async getAddonVersions(input: string, next?: string) {
    const slug: string = this.getAddonSlug(input);

    const url = next
      ? next
      : `${constants.apiBaseURL}addons/addon/${slug}/versions?filter=all_with_deleted`;

    const headers = await this.credentialController.makeAuthHeader();
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorMessages: ErrorMessages = {
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

      return await NotificationView.showErrorMessage(
        errorMessages,
        response.status,
        this.getAddonVersions,
        [input, next]
      );
    }
    const json = await response.json();
    return json;
  }

  /**
   * Downloads and extracts an add-on to the root folder. If no add-on is specified, prompts the user.
   * @param urlGuid GUID of the add-on.
   * @param urlVersion The version to download.
   * @returns the workspace folder, guid, and version.
   */
  async downloadAndExtract(urlGuid?: string, urlVersion?: string) {
    try {
      const input = urlGuid || (await AddonView.getInput());
      const json: AddonInfoResponse = await this.getAddonInfo(input);
      const versionInfo = await this.getVersionChoice(input, urlVersion);
      const addonFileID = versionInfo.fileID;
      const version = versionInfo.version;
      const guid = json.guid;
      const addonID = json.id;

      const workspaceFolder =
        await this.directoryController.getRootFolderPath();
      const compressedFilePath = path.join(
        workspaceFolder,
        `${guid}_${version}.xpi`
      );

      this.addonCacheController.addAddonToCache(guid, {
        reviewUrl: json.review_url,
        version: version,
        fileID: addonFileID,
        id: addonID,
        isDirty: false
      });

      const writeStream = await this.downloadAddon(
        addonFileID,
        compressedFilePath
      );
      await new Promise((resolve) => writeStream.on("finish", resolve));

      await this.extractAddon(
        compressedFilePath,
        path.join(workspaceFolder, guid, version)
      );

      this.sidebarController.refresh();

      //TODO: lint workspace

      return { workspaceFolder, guid, version };
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Cycles through the versions of an addon.
   * @param input A string identifying a given add-on.
   * @param urlVersion the linked version, if any
   * @returns
   */
  async getVersionChoice(input: string, urlVersion?: string) {
    const versions: AddonVersion[] = [];
    let next: string | undefined = undefined;
    let init = true;

    do {
      if (next || init) {
        init = false;
        const res = await this.getAddonVersions(input, next);
        versions.push(...res.results);
        next = res.next;
      }

      const versionItems = versions.map((version) => version.version);
      next ? versionItems.push("More") : null;

      // if opened from a vscode:// link, use the version from the link
      const choice =
        urlVersion || (await AddonView.promptVersionChoice(versionItems));

      if (choice === "More") {
        continue;
      } else if (choice) {
        const chosenVersion = versions.find(
          (version) => version.version === choice
        );

        if (chosenVersion) {
          return {
            fileID: chosenVersion.file.id,
            version: chosenVersion.version,
          };
        } else {
          vscode.window.showErrorMessage("No version file found");
          throw new Error("No version file found");
        }
      } else {
        throw new Error("No version choice selected");
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }

  /**
   * Fetches the information about a given add-on.
   * @param input A string identifying a given addon.
   * @returns The addon information.
   */
  private async getAddonInfo(input: string): Promise<AddonInfoResponse> {
    const slug: string = this.getAddonSlug(input);
    const url = `${constants.apiBaseURL}addons/addon/${slug}`;
    const headers = await this.credentialController.makeAuthHeader();

    const response = await fetch(url, { headers: headers });
    if (!response.ok) {
      const errorMessages: ErrorMessages = {
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

      return await NotificationView.showErrorMessage(
        errorMessages,
        response.status,
        this.getAddonInfo,
        [input]
      );
    }
    const json = await response.json();
    return json;
  }

  /**
   * Fetches and returns the response for the file fetch.
   * @param fileId id of the xpi.
   * @returns The response given by the API.
   */
  private async fetchDownloadFile(fileId: string) {
    const url = `${constants.downloadBaseURL}${fileId}`;
    const headers = await this.credentialController.makeAuthHeader();
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorMessages: ErrorMessages = {
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

      return await NotificationView.showErrorMessage(
        errorMessages,
        response.status,
        this.fetchDownloadFile,
        [fileId]
      );
    }
    return response;
  }

  /**
   * Fetches and downloads the add-on to path.
   * @param fileId The fileId of the add-on's xpi
   * @param path The path to save the add-on to.
   */
  private async downloadAddon(fileID: string, filepath: string) {
    const dest = fs.createWriteStream(filepath, { flags: "w" });
    const handleError = async () => {
      const errorMessages: ErrorMessages = {
        window: {
          other: `Could not download addon to ${filepath}`,
        },
        thrown: {
          other: "Download failed",
        },
      };
      await NotificationView.showErrorMessage(
        errorMessages,
        "other",
        this.downloadAddon,
        [fileID, filepath]
      );
      dest.close();
    };

    dest.on("error", handleError);
    NotificationView.promptProgress("Downloading Addon", async () => {
      try {
        const response = await this.fetchDownloadFile(fileID);
        const buffer = await response.buffer();
        dest.write(buffer);
        dest.end();
      } catch (error) {
        handleError();
      }
    });

    return dest;
  }

  /**
   * Extracts the add-on xpi into its version folder in the root add-ons directory.
   * @param compressedFilePath The location of the xpi.
   * @param addonVersionFolderPath The location to store the add-on version.
   */
  private async extractAddon(
    compressedFilePath: string,
    addonVersionFolderPath: string
  ) {
    // if the directory exists, ask to overwrite.
    if (!(await this.dirExistsOrMake(addonVersionFolderPath))) {
      try {
        await AddonView.promptOverwrite();
      } catch {
        await fs.promises.unlink(compressedFilePath);
        return;
      }
    }

    await extract(compressedFilePath, {
      dir: addonVersionFolderPath,
    });
    await fs.promises.unlink(compressedFilePath);

    if (!fs.existsSync(addonVersionFolderPath)) {
      const errorMessages: ErrorMessages = {
        window: {
          other: `Extraction failed. Could not find ${addonVersionFolderPath}.`,
        },
        thrown: {
          other: "Extraction failed.",
        },
      };

      return await NotificationView.showErrorMessage(
        errorMessages,
        "other",
        this.extractAddon,
        [compressedFilePath, addonVersionFolderPath]
      );
    }

    vscode.window.showInformationMessage("Extraction complete.");
  }

  /**
   * Creates a directory at location dir.
   * @param dir The directory to create.
   * @returns Whether the directory was created.
   */
  private async dirExistsOrMake(dir: string) {
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
      return true;
    }
    return false;
  }

  /**
   * Extracts an add-on's slug from a URL or other user input. If a slug cannot be
   * identified, return the input string.
   *
   * The addon's slug is assumed to be the string between a well-known delimiter
   * and an optional slash after the delimiter. For example, in input string of
   * "...addon/ublock-origin/?utm_source..." would return "ublock-origin".
   *
   * Well-known URL delimiters are:
   * - "addon/" - A normal AMO link.
   * - "review/" - A listed add-on in the AMO reviewer tools.
   * - "review-unlisted/" - A unlisted listed add-on in the AMO reviewer tools.
   * @param input The input to clean.
   * @returns The add-on slug.
   */
  private getAddonSlug(input: string) {
    let delimiter = "addon/";
    if (input.includes("review/")) {
      delimiter = "review/";
    } else if (input.includes("review-unlisted/")) {
      delimiter = "review-unlisted/";
    }
    return input.includes("/")
      ? input.split(delimiter)[1]?.split("/")[0]
      : input;
  }
}
