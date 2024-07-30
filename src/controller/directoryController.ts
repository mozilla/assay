import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { AddonTreeItem } from "../model/sidebarTreeDataProvider";
import { FilesReadonlyIncludeConfig } from "../types";
import { RootView } from "../views/rootView";

export class DirectoryController {
  private cachedRootFolder: string | undefined;

  constructor() {
    const assayConfig = vscode.workspace.getConfiguration("assay");
    const rootFolder = assayConfig.get<string>("rootFolder");
    this.setCachedRootFolder(rootFolder);
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
      this.setRootToReadonly();
      return newRootFolder;
    }
    return rootFolder;
  }

  /**
   * Whenever rootFolder or readonlyInclude is modified, ensures that:
   * 1) the old root folder is removed from readonly, and
   * 2) the new one is added.
   * @param event The configuration change event.
   */
  async handleRootConfigurationChange(event: vscode.ConfigurationChangeEvent) {
    if (
      event.affectsConfiguration("assay.rootFolder") ||
      event.affectsConfiguration("files.readonlyInclude")
    ) {
      await this.setRootToReadonly();
    }
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
   * Sets the root to read-only.
   */
  private async setRootToReadonly() {
    const assayConfig = vscode.workspace.getConfiguration("assay");
    const rootFolder = assayConfig.get<string>("rootFolder");

    const fileConfig = vscode.workspace.getConfiguration("files");
    const readOnlyFiles = fileConfig.get(
      "readonlyInclude"
    ) as FilesReadonlyIncludeConfig;

    // remove the cachedRootFolder's readonly property.
    const globInitialFolder = `${this.cachedRootFolder}/**`;
    if (globInitialFolder in readOnlyFiles) {
      readOnlyFiles[globInitialFolder] = false;
    }
    await fileConfig.update(
      "readonlyInclude",
      { ...readOnlyFiles, [`${rootFolder}/**`]: true },
      vscode.ConfigurationTarget.Global
    );

    // update the cached root folder here and on launch
    this.setCachedRootFolder(rootFolder);
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

  /**
   * Updates the cached root folder.
   * @param filepath the location of the root folder.
   */
  private setCachedRootFolder(filepath: string | undefined) {
    this.cachedRootFolder = filepath;
  }
}
