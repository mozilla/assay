import * as fs from "fs";
import fetch from "node-fetch";
import * as vscode from "vscode";

import { showErrorMessage } from "./processErrors";
import { makeAuthHeader } from "./requestAuth";
import constants from "../../config/config";
import { errorMessages } from "../types";

async function fetchDownloadFile(fileId: string) {
  const url = `${constants.downloadBaseURL}${fileId}`;
  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorMessages: errorMessages = {
      window: {
        404: `(Status ${response.status}): XPI download file not found`,
        401: `(Status ${response.status}): Unauthorized request for XPI file`,
        403: `(Status ${response.status}): Inadequate permissions for XPI file`,
        other: `(Status ${response.status}): Could not fetch XPI file`,
      },
      thrown: {
        404: "Download file not found",
        401: "Unauthorized request",
        403: "Forbidden request",
        other: "Download request failed",
      },
    };

    await showErrorMessage(errorMessages, response.status, fetchDownloadFile, [
      fileId,
    ]);
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
        const errorMessages: errorMessages = {
          window: {
            other: `Could not download addon to ${path}`,
          },
          thrown: {
            other: "Download failed",
          },
        };

        await showErrorMessage(errorMessages, "other", downloadAddon, [
          fileId,
          path,
        ]);
      }
    }
  );
}
