import * as fs from "fs";
import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../../config/config";

async function fetchDownloadFile(fileId: string) {
  const url = `${constants.downloadBaseURL}${fileId}`;
  const response = await fetch(url);
  if (!response.ok) {
    vscode.window
      .showErrorMessage(
        `(Status ${response.status}): Could not fetch download file.`,
        { modal: true },
        "Try Again",
        "Fetch New Addon"
      )
      .then((action) => {
        if (action === "Try Again") {
          fetchDownloadFile(fileId);
        } else if (action === "Fetch New Addon") {
          vscode.commands.executeCommand("assay.get");
        }
      });
    throw new Error("Request failed");
  }
  return response;
}

export async function downloadAddon(fileId: string, path: string) {
  await vscode.window.withProgress(
    { title: "Assay", location: vscode.ProgressLocation.Notification },
    async function (progress) {
      progress.report({
        message: "Downloading Addon",
      });
      const response = await fetchDownloadFile(fileId);

      const dest = fs.createWriteStream(path, { flags: "w" });
      dest.write(await response.buffer());
      dest.close();
      if (!fs.existsSync(path)) {
        vscode.window
          .showErrorMessage(
            `Could not download addon to ${path}`,
            { modal: true },
            "Try Again",
            "Fetch New Addon"
          )
          .then((action) => {
            if (action === "Try Again") {
              fs.rmSync(path);
              downloadAddon(fileId, path);
            } else if (action === "Fetch New Addon") {
              vscode.commands.executeCommand("assay.get");
            }
          });
        throw new Error("Download failed");
      }
    }
  );
}
