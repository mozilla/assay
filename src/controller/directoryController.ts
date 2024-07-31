import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { AddonTreeItem } from "../model/sidebarTreeDataProvider";
import { RootView } from "../views/rootView";

export class DirectoryController {
  /**
   * Retrieve the line from uri.
   * @param uri The uri to retrieve the line from
   * @param lineNumber the line number to retrieve.
   * @returns the line, or empty string if none is read.
   */
  async getLineFromFile(uri: vscode.Uri, lineNumber: number) {
    const buffer = await this.readFile(uri);
    const content = buffer?.toString()?.split("\n");
    return content?.at(lineNumber) ?? "";
  }

  /**
   * Gets the root folder stored in config.
   * @returns the root folder in config.
   */
  async getRootFolderPath() {
    const assayConfig = vscode.workspace.getConfiguration("assay");
    const rootFolder = assayConfig.get<string>("rootFolder");

    // check if the folder still exists. if it doesn't, prompt the user to select a new one
    if ((rootFolder && !fs.existsSync(rootFolder)) || !rootFolder) {
      const newRootFolder = await RootView.selectRootFolder();
      if (!newRootFolder) {
        throw new Error("No root folder selected");
      }
      await this.storeRootFolderSetting(newRootFolder);
      return newRootFolder;
    }
    return rootFolder;
  }

  /**
   * Splits a uri inside the rootFolder into its individual pieces.
   * @param uri The uri to split.
   * @returns the pieces of the uri.
   */
  async splitUri(uri: vscode.Uri) {
    const fullPath = uri.fsPath;
    const rootFolder = await this.getRootFolderPath();
    const relativePath = fullPath.replace(rootFolder, "");
    const [_, guid, version] = relativePath.split(path.sep);
    const filepath = relativePath.split(version)[1];
    const versionPath = version
      ? path.join(rootFolder, guid, version)
      : undefined;
    return {
      rootFolder,
      versionPath,
      fullPath,
      relativePath,
      guid,
      version,
      filepath,
    };
  }

  /**
   * Determines whether uri is in the rootFolder.
   * @param uri
   * @returns whether the uri is in rootFolder.
   */
  async inRoot(uri: vscode.Uri) {
    const { rootFolder, fullPath } = await this.splitUri(uri);
    if (fullPath.startsWith(rootFolder)) {
      return true;
    }
    return false;
  }

  /**
   * Read the file located at uri.
   * @param uri
   * @returns Uint8Array of the file at uri.
   */
  async readFile(uri: vscode.Uri) {
    try {
      return await vscode.workspace.fs.readFile(uri);
    } catch {
      return new Uint8Array();
    }
  }

  /**
   * Deletes the associated uri of all selected AddonTreeItems.
   * @param list Selected AddonTreeItems
   * @returns the failed uris.
   */
  static async deleteUri(list: AddonTreeItem[]) {
    const promises = [];
    const failedUris: vscode.Uri[] = [];

    for (const item of list) {
      const thenable = vscode.workspace.fs.delete(item.uri, {
        recursive: true,
      });
      const promise = Promise.resolve(thenable).catch(() =>
        failedUris.push(item.uri)
      );
      promises.push(promise);
    }

    await Promise.all(promises);
    return failedUris;
  }

  /**
   * Updates the config's rootFolder.
   * @param rootFolder The location of the root folder.
   */
  private async storeRootFolderSetting(rootFolder: string) {
    const assayConfig = vscode.workspace.getConfiguration("assay");
    await assayConfig.update(
      "rootFolder",
      rootFolder,
      vscode.ConfigurationTarget.Global
    );
  }
}
