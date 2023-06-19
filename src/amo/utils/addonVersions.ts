import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";
import { addonVersion } from "../types";

async function getPaginatedVersions(input: string, next: string) {
  const url = next;
  const response = await fetch(url);
  if (!response.ok) {
    vscode.window
      .showErrorMessage(
        `(Status ${response.status}): Could not fetch versions.`,
        { modal: true },
        "Try Again",
        "Fetch New Addon"
      )
      .then((action) => {
        if (action === "Try Again") {
          getAddonVersions(input, next);
        } else if (action === "Fetch New Addon") {
          vscode.commands.executeCommand("assay.get");
        }
      });
    throw new Error("Failed to fetch versions");
  }
  const json = await response.json();
  return json;
}

async function getFirstVersions(input: string) {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}addons/addon/${slug}/versions/`;
  const response = await fetch(url);
  if (!response.ok) {
    vscode.window
      .showErrorMessage(
        `(Status ${response.status}) Addon ${slug} not found.`,
        { modal: true },
        "Try Again"
      )
      .then((action) => {
        if (action === "Try Again") {
          vscode.commands.executeCommand("assay.get");
        }
      });
    throw new Error("Failed to fetch addon");
  }
  const json = await response.json();
  return json;
}

export async function getAddonVersions(input: string, next?: string) {
  if (next) {
    return getPaginatedVersions(input, next);
  } else {
    return getFirstVersions(input);
  }
}

export async function getVersionChoice(
  input: string
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

    const choice = await vscode.window.showQuickPick(versionItems, {
      placeHolder: "Choose a version",
    });

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
