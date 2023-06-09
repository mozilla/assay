import * as fs from "fs";
import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";

export async function downloadAddon(fileId: string, path: string) {
  const url = `${constants.downloadBaseURL}${fileId}`;
  const response = await fetch(url);

  if (response.ok) {
    const dest = fs.createWriteStream(path, { flags: "w" });
    dest.write(await response.buffer());
    dest.close();
    vscode.window.showInformationMessage("Download complete");
  }
}
