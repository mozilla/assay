import * as vscode from "vscode";

import { DirectoryController } from "./directoryController";
import { AddonTreeDataProvider } from "../model/sidebarTreeDataProvider";

export class SidebarController {
  constructor(
    public id: string,
    private directoryController: DirectoryController
  ) {}

  /**
   * Fetch the TreeView of addons.
   * @returns TreeView and refresh method.
   */
  async getTreeView() {
    const rootFolderPath = await this.directoryController.getRootFolderPath();
    const treeProvider = new AddonTreeDataProvider(rootFolderPath);

    const refresh = () => {
      treeProvider.refresh();
    };

    const treeView = vscode.window.createTreeView(this.id, {
      treeDataProvider: treeProvider,
      canSelectMany: true,
    });

    return { refresh: refresh, treeView: treeView };
  }
}
