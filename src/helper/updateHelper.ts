import { spawn } from "child_process";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

export class UpdateHelper {
  /**
   * Checks whether a new version of Assay is available.
   * Prompts the user for the option to update.
   */
  static async updateAssay() {
    const downloadInfo = await UpdateHelper.checkAndGetNewVersion();
    if (downloadInfo) {
      const { downloadLink, currentVersion, version } = downloadInfo;
      vscode.window
        .showInformationMessage(
          `A new version of Assay is available (${version}) from your current version (${currentVersion}). Would you like to update?`,
          "Update Assay"
        )
        .then((value) => {
          if(value){
            UpdateHelper.installNewVersion(downloadLink, version);
          }
        });
    }
  }

  /**
   * Installs the new version of Assay.
   * @param downloadUrl The URL of the extension.
   * @param version The version installed.
   */
  private static async installNewVersion(downloadUrl: string, version: string) {
    const versionProcess = spawn("code", ["--version"]);
    versionProcess.on("error", () => {
      vscode.window.showErrorMessage(
        "'code' command not found in PATH. Please add it via the VS Code Command Palette and try again."
      );
    });

    const savePath = await UpdateHelper.downloadVersion(downloadUrl);
    const downloadProcess = spawn("code", ["--install-extension", savePath]);

    downloadProcess.on("exit", (code) => {
      console.log(`Download process exited with code ${code}`);
      if (code !== 0) {
        vscode.window.showErrorMessage(
          `Assay could not be updated to version ${version}. Please try again.`
        );
        return false;
      }
      fs.unlinkSync(savePath);

      vscode.window.showInformationMessage(
        `Assay updated to version ${version}. Please reload VSCode.`
      );

      return true;
    });
  }

  /**
   * Downloads the new version of Assay.
   * @param downloadUrl The URL of the extension.
   * @returns The location of the saved extension.
   */
  private static async downloadVersion(downloadUrl: string) {
    return await vscode.window.withProgress(
      { title: "Assay", location: vscode.ProgressLocation.Notification },
      async function (progress) {
        progress.report({
          message: "Downloading Version",
        });

        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(
            `Could not fetch version file from GitHub: ${response.statusText}`
          );
        }

        const extensionPath =
          vscode.extensions.getExtension("mozilla.assay")?.extensionPath;
        if (!extensionPath) {
          throw new Error("Could not find extension path");
        }
        const savePath = path.join(extensionPath, "version.vsix");

        const buffer = await response.buffer();
        return new Promise<string>((resolve, reject) => {
          fs.writeFile(savePath, buffer, { flag: "w" }, (err) => {
            if (err) {
              reject(new Error(`Could not write version file: ${err.message}`));
            } else {
              resolve(savePath);
            }
          });
        });
      }
    );
  }

  /**
   * Checks if Assay needs to be updated.
   * @returns the downloadLink and new version, if any
   */
  private static async checkAndGetNewVersion() {
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
      'v' + vscode.extensions.getExtension("mozilla.assay")?.packageJSON.version;

    if (latestVersion !== currentVersion) {
      return {
        downloadLink: json.assets[0].browser_download_url,
        version: latestVersion,
        currentVersion,
      };
    }

    vscode.window.showInformationMessage(
      `Assay is up to date (${currentVersion}).`
    );
  }
}
