import fetch from "node-fetch";

export async function getAddonInfo(input: string) {
  if (input.includes("/")) {
    // only for links
    const slug = input.split("addon/")[1].split("/")[0];
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${slug}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } else {
    // other identifiers work here
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${input}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}
