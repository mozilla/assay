import * as vscode from "vscode";

import { DirectoryController } from "./directoryController";
import {
  AddonTreeDataProvider,
  AddonTreeItem,
} from "../model/sidebarTreeDataProvider";
import { TypeOption } from "../types";

export class SidebarController {
  public refresh: () => void;
  public xpiTreeView: vscode.TreeView<vscode.TreeItem>;
  public srcTreeView: vscode.TreeView<vscode.TreeItem>;

  constructor(
    public xpiID: string,
    public srcID: string,
    rootFolderPath: string
  ) {
    const srcTreeProvider = new AddonTreeDataProvider(
      `${rootFolderPath}/${TypeOption.Source}`
    );
    const xpiTreeProvider = new AddonTreeDataProvider(
      `${rootFolderPath}/${TypeOption.Xpi}`
    );

    this.refresh = () => {
      srcTreeProvider.refresh();
      xpiTreeProvider.refresh();
    };

    this.xpiTreeView = vscode.window.createTreeView(this.xpiID, {
      treeDataProvider: xpiTreeProvider,
      canSelectMany: true,
    });

    this.srcTreeView = vscode.window.createTreeView(this.srcID, {
      treeDataProvider: srcTreeProvider,
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
