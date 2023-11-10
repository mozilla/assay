import { spawn } from "child_process";
import fetch from "node-fetch";
import * as vscode from "vscode";

import { showErrorMessage } from "../utils/processErrors";

export async function newVersion() {
  // check the github page to see if there is a new release
  const apiUrl = `https://api.github.com/repos/mozilla/assay/releases/latest`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(
      `Could not fetch latest version from GitHub: ${response.statusText}`
    );
  }

  const json = await response.json();
  const latestVersion = json.tag_name;
  const currentVersion =
    vscode.extensions.getExtension("mozilla.assay")?.packageJSON.version;

  if (latestVersion !== currentVersion) {
    return json.assets[0].browser_download_url;
  }

  return false;
}

export async function installNewVersion(downloadUrl: string) {
  const downloadProcess = spawn("code", ["--install-extension", downloadUrl]);
  downloadProcess.on("error", (err) => {
    vscode.window.showErrorMessage(
      `Assay failed to install new version: ${err.message}`
    );
    return;
  });
  return true;
}

export async function updateAssay() {
  const newVersionLink = await newVersion();
  if (newVersionLink && (await installNewVersion(newVersionLink))) {
    vscode.window.showInformationMessage(
      `Assay has been updated to version ${newVersionLink}, please restart VSCode to complete the update.`
    );
  }
}
