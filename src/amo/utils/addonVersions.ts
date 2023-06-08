import fetch from "node-fetch";
import { AddonVersion } from "../interfaces";
import * as vscode from "vscode";

export async function getAddonVersions(
  input: string | undefined,
  next?: string
) {
  if (next) {
    const url = next;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
  if (!input) {
    return;
  } else if (input.includes("/")) {
    // only for links
    const slug = input.split("addon/")[1].split("/")[0];
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${slug}/versions/`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } else {
    // other identifiers work here
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${input}/versions/`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}

export async function getVersionChoice(
  input: string
): Promise<{ fileID: string; version: string } | undefined> {
  let versions: AddonVersion[] = [];
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
        return;
      }
    } else {
      break;
    }
  } while (true);
}
