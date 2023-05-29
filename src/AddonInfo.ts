import fetch from "node-fetch";

export async function getAddonInfo(input: string | undefined) {
  if (!input) {
    return;
  } else if (input.includes("/")) {
    const slug = input.split("addon/")[1].split("/")[0];
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${slug}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("An error occurred:", error);
    }
  } else if (input.includes("-")) {
    const slug = input;
    const url = `https://addons.mozilla.org/api/v5/addons/addon/${slug}`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
}
