import fetch from "node-fetch";

import constants from "../../config/config";

export async function getAddonInfo(input: string) {
  const slug: string = input.includes("/")
    ? input.split("addon/")[1].split("/")[0]
    : input;
  const url = `${constants.apiBaseURL}${slug}`;
  const response = await fetch(url);
  const json = await response.json();
  return json;
}
