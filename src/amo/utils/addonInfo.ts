import fetch from "node-fetch";

import { showErrorMessage } from "./processErrors";
import { makeAuthHeader } from "./requestAuth";
import constants from "../../config/config";
import { addonInfoResponse, errorMessages } from "../types";

export async function getAddonInfo(input: string): Promise<addonInfoResponse> {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}addons/addon/${slug}`;
  const headers = await makeAuthHeader();

  const response = await fetch(url, { headers: headers });
  if (!response.ok) {
    const errorMessages: errorMessages = {
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

    await showErrorMessage(errorMessages, response.status, getAddonInfo, [
      input,
    ]);
  }
  const json = await response.json();
  return json;
}
