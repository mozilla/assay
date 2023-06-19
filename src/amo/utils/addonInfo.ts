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
    vscode.window.showErrorMessage("Failed to fetch addon info");
    throw new Error("Failed to fetch addon info");
  }
  const json = await response.json();
  return json;
}
