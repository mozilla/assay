import fetch from "node-fetch";

import { showErrorMessage } from "./processErrors";
import { makeAuthHeader } from "./requestAuth";
import constants from "../../config/config";
import { addonInfoResponse } from "../types";

export async function getAddonInfo(input: string): Promise<addonInfoResponse> {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}addons/addon/${slug}`;
  const headers = await makeAuthHeader();

  const response = await fetch(url, { headers: headers });
  if (!response.ok) {
    await showErrorMessage(
      `(Status ${response.status}): Could not fetch addon info.`,
      "Failed to fetch addon info",
      getAddonInfo,
      [input]
    );
  }
  const json = await response.json();
  return json;
}
