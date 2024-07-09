import * as vscode from "vscode";

import { DirectoryController } from "./directoryController";
import {
  AddonTreeDataProvider,
  AddonTreeItem,
} from "../model/sidebarTreeDataProvider";

export class SidebarController {
  public refresh: () => void;
  public treeView: vscode.TreeView<vscode.TreeItem>;

  constructor(public id: string, rootFolderPath: string) {
    const treeProvider = new AddonTreeDataProvider(rootFolderPath);

    this.refresh = () => {
      treeProvider.refresh();
    };

    this.treeView = vscode.window.createTreeView(this.id, {
      treeDataProvider: treeProvider,
      canSelectMany: true,
    });
  }

  /**
   * Deletes the selected uris and refreshes the sidebar.
   * @param treeItem The specific AddonTreeItem the user opened the context menu on.
   * @param list Selected AddonTreeItems
   * @returns whether all were successfully deleted.
   */
  async delete(treeItem: AddonTreeItem, list: AddonTreeItem[] | undefined) {
    list = list || [treeItem];
    const result = await DirectoryController.deleteUri(list);
    this.refresh();
    return result;
  }
}
