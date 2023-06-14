import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";
import { addonVersion } from "../types";

export async function getAddonVersions(input: string, next?: string) {
  if (next) {
    const url = next;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}addons/addon/${slug}/versions/`;
  console.log(url);
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

export async function getVersionChoice(
  input: string
): Promise<{ fileID: string; version: string } | undefined> {
  const versions: addonVersion[] = [];
  let next: string | undefined = undefined;
  let init = true;

  do {
    if (next || init) {
      init = false;
      const res = await getAddonVersions(input, next);
      console.log(res);
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
        return;
      }
    } else {
      break;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);
}
