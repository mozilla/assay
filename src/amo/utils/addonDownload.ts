import * as fs from "fs";
import fetch from "node-fetch";
import * as vscode from "vscode";

import { showErrorMessage } from "./processErrors";
import constants from "../../config/config";

async function fetchDownloadFile(fileId: string) {
  const url = `${constants.downloadBaseURL}${fileId}`;
  const response = await fetch(url);
  if (!response.ok) {
    await showErrorMessage(
      `(Status ${response.status}): Could not fetch addon info.`,
      "Request failed",
      fetchDownloadFile,
      [fileId]
    );
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
        await showErrorMessage(
          `Could not download addon to ${path}.`,
          "Download failed",
          downloadAddon,
          [fileId, path]
        );
      }
    }
  );
}
