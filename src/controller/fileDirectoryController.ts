import * as fs from "fs";
import * as vscode from "vscode";

import { filesReadonlyIncludeConfig } from "../types";
import { selectRootFolder } from "../views/rootView";

export class FileDirectoryController{
  private cachedRootFolder: string | undefined;

  constructor(private assayConfig: vscode.WorkspaceConfiguration,
              private fileConfig: vscode.WorkspaceConfiguration){
    const rootFolder = this.assayConfig.get<string>("rootFolder");
    this.setCachedRootFolder(rootFolder);
  }

  async getRootFolderPath() {
    const rootFolder = this.assayConfig.get<string>("rootFolder");

    // check if the folder still exists. if it doesn't, prompt the user to select a new one
    if ((rootFolder && !fs.existsSync(rootFolder)) || !rootFolder) {
      const newRootFolder = await selectRootFolder();
      if (!newRootFolder) {
        throw new Error("No root folder selected");
      }
      await this.storeRootFolderSetting(newRootFolder);
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
  async handleRootConfigurationChange(
    event: vscode.ConfigurationChangeEvent
  ) {
    if (
      event.affectsConfiguration("assay.rootFolder") ||
      event.affectsConfiguration("files.readonlyInclude")
    ) {
      await this.setRootToReadonly();
    }
  }

  async splitUri(uri: vscode.Uri) {
    const fullPath = uri.fsPath;
    const rootFolder = await this.getRootFolderPath();
    const relativePath = fullPath.replace(rootFolder, "");
    const guid = relativePath.split("/")[1];
    const version = relativePath.split("/")[2];
    const filepath = relativePath.split(version)[1];
    const versionPath = version ? `${rootFolder}/${guid}/${version}` : undefined;
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

  async readFile(uri: vscode.Uri) {
    try {
      return await vscode.workspace.fs.readFile(uri);
    } catch {
      return new Uint8Array();
    }
  }

  /**
   * Sets the root to read-only.
   */
  private async setRootToReadonly() {
    const rootFolder = this.assayConfig.get<string>("rootFolder");

    const readOnlyFiles = this.fileConfig.get(
      "readonlyInclude"
    ) as filesReadonlyIncludeConfig;

    // remove the cachedRootFolder's readonly property.
    const globInitialFolder = `${this.cachedRootFolder}/**`;
    if (globInitialFolder in readOnlyFiles) {
      readOnlyFiles[globInitialFolder] = false;
    }

    await this.fileConfig.update(
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
    await this.assayConfig.update(
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