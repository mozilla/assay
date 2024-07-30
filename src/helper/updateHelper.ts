import { spawn } from "child_process";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";

export class UpdateHelper {
  /**
   * Updates Assay.
   * @returns Whether Assay was updated.
   */
  static async updateAssay() {
    const downloadInfo = await UpdateHelper.checkAndGetNewVersion();
    if (!downloadInfo) {
      return false;
    }
    const { downloadLink, version } = downloadInfo.downloadLink;
    UpdateHelper.installNewVersion(downloadLink, version);
    return true;
  }

  /**
   * Installs the new version of Assay.
   * @param downloadUrl The URL of the extension.
   * @param version The version installed.
   */
  private static async installNewVersion(downloadUrl: string, version: string) {
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

        try {
          const dest = fs.createWriteStream(savePath, { flags: "w" });
          dest.write(await response.buffer());
          dest.close();
        } catch (err: any) {
          throw new Error(`Could not write version file: ${err.message}`);
        }

        return savePath;
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
      vscode.extensions.getExtension("mozilla.assay")?.packageJSON.version;

    if (latestVersion !== currentVersion) {
      return {
        downloadLink: json.assets[0].browser_download_url,
        version: latestVersion,
      };
    }

    vscode.window.showInformationMessage(
      `Assay is up to date (version ${currentVersion})`
    );
  }
}
