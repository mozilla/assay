import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";
import { addonInfoResponse } from "../types";

export async function getAddonInfo(input: string): Promise<addonInfoResponse> {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}addons/addon/${slug}`;
  const response = await fetch(url);
  if (!response.ok) {
    vscode.window
      .showErrorMessage(
        ` (Status ${response.status}): Could not fetch addon info.`,
        { modal: true },
        "Try Again",
        "Fetch New Addon"
      )
      .then((action) => {
        if (action === "Try Again") {
          return getAddonInfo(input);
        } else if (action === "Fetch New Addon") {
          vscode.commands.executeCommand("assay.get");
        }
      });
    throw new Error("Failed to fetch addon info");
  }
  const json = await response.json();
  return json;
}
