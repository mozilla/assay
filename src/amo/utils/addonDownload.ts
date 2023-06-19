import * as fs from "fs";
import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";

export async function downloadAddon(fileId: string, path: string) {
  await vscode.window.withProgress(
    { title: "Assay", location: vscode.ProgressLocation.Notification },
    async function (progress) {
      progress.report({
        message: "Downloading Addon",
      });

      const url = `${constants.downloadBaseURL}${fileId}`;
      const response = await fetch(url);
      if (!response.ok) {
        vscode.window.showErrorMessage("Download failed");
        throw new Error("Request failed");
      }

      const dest = fs.createWriteStream(path, { flags: "w" });
      dest.write(await response.buffer());
      dest.close();
      if (!fs.existsSync(path)) {
        vscode.window.showErrorMessage("Download failed");
        throw new Error("Download failed");
      }
    }
  );
}
