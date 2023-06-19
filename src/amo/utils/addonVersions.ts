import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";
import { addonVersion } from "../types";

export async function getAddonVersions(input: string, next?: string) {
  try {
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
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    throw new Error("Failed to fetch versions");
  }
}

export function getVersionChoice(
  input: string
): Promise<{ fileID: string; version: string }> {
  return new Promise((resolve, reject) => {
    const versions: addonVersion[] = [];
    let next: string | undefined = undefined;
    let init = true;

    const processNextVersion = () => {
      if (next || init) {
        init = false;
        getAddonVersions(input, next).then((res) => {
          versions.push(...res.results);
          next = res.next;
          promptVersionChoice();
        });
      } else {
        promptVersionChoice();
      }
    };

    const promptVersionChoice = () => {
      const versionItems = versions.map((version) => version.version);
      next ? versionItems.push("More") : null;

      vscode.window
        .showQuickPick(versionItems, { placeHolder: "Choose a version" })
        .then((choice) => {
          if (choice === "More") {
            processNextVersion();
          } else if (choice) {
            const chosenVersion = versions.find(
              (version) => version.version === choice
            );

            if (chosenVersion) {
              resolve({
                fileID: chosenVersion.file.id,
                version: chosenVersion.version,
              });
            } else {
              reject(new Error("No version file found"));
            }
          } else {
            reject(new Error("No version choice provided"));
          }
        });
    };
    processNextVersion();
  });
}
