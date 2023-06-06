import * as fs from "fs";
import * as vscode from "vscode";
import fetch from "node-fetch";

export async function downloadAddon(id: string, path: string) {
  const url = `https://addons.mozilla.org/firefox/downloads/file/${id}`;
  const response = await fetch(url);

  if (response.ok) {
    const dest = fs.createWriteStream(path, { flags: "w" });
    dest.write(await response.buffer());
    dest.close();
    vscode.window.showInformationMessage("Download complete");
  } else {
    console.error("Request failed:", response.status);
  }
}
