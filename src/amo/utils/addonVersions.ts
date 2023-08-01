import fetch from "node-fetch";
import * as vscode from "vscode";

import { showErrorMessage } from "./processErrors";
import { makeAuthHeader } from "./requestAuth";
import constants from "../../config/config";
import { addonVersion } from "../types";

export async function getAddonVersions(input: string, next?: string) {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = next
    ? next
    : `${constants.apiBaseURL}addons/addon/${slug}/versions?filter=all_with_unlisted`;

  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errMsgWindow = next
      ? "Could not fetch more versions"
      : `Addon ${slug} not found`;
    const errMsgThrown = next
      ? "Failed to fetch versions"
      : "Failed to fetch addon";

    await showErrorMessage(
      `(Status ${response.status}) ${errMsgWindow}.`,
      errMsgThrown,
      getAddonVersions,
      [input, next]
    );
  }
  const json = await response.json();
  return json;
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
