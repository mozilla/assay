import * as vscode from "vscode";

import { showErrorMessage } from "./notificationView";
import constants from "../config/config";
import { getAddonVersions } from "../controller/addonController";
import { QPOption, addonVersion, errorMessages } from "../types";
import { makeAuthHeader } from "../utils/requestAuth";

/**
 * Retrieve the user's desired add-on to download.
 * @param input The user input representing the add-on.
 * @param urlVersion add-on version, if any.
 * @returns 
 */
export async function getVersionChoice(
    input: string,
    urlVersion?: string
  ): Promise<{ fileID: string; version: string }> {
    const versions: addonVersion[] = [];
    let next: string | undefined = undefined;
    let init = true;
  
    do {
      if (next || init) {
        init = false;
        const res = await getAddonVersions(input, next);
        versions.push(...res.results);
        next = res.next;
      }
  
      const versionItems = versions.map((version) => version.version);
      next ? versionItems.push("More") : null;
  
      // if opened from a vscode:// link, use the version from the link
      const choice =
        urlVersion ||
        (await vscode.window.showQuickPick(versionItems, {
          placeHolder: "Choose a version",
        }));
  
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
 * Prompts the user to input an add-on slug.
 * @returns the user input.
 */
export async function getInput(): Promise<string> {
    const input = await vscode.window.showInputBox({
        prompt: "Enter Addon Slug, GUID, AMO ID, or URL",
        title: "Assay",
        ignoreFocusOut: true,
    });
    if (!input) {
        throw new Error("No input provided");
    }
    return input;
}

/**
 * Prompts the user whether to overwrite the existing add-on.
 */
export async function promptOverwrite(){
    const choice = await vscode.window.showQuickPick(
        [QPOption.Yes, QPOption.No],
        {
          placeHolder: "Addon already exists. Overwrite?",
        }
      );
      if (choice === QPOption.No || !choice) {
        throw new Error("Extraction cancelled");
      }
}