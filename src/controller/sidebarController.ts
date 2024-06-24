import * as vscode from "vscode";


import { AddonTreeDataProvider } from "../model/sidebarTreeDataProvider";

export class SidebarController {
  public refresh: () => void;
  public treeView: vscode.TreeView<vscode.TreeItem>;

  constructor(
    public id: string,
    rootFolderPath: string
  ) {
    const treeProvider = new AddonTreeDataProvider(rootFolderPath);

    this.refresh = () => {
      treeProvider.refresh();
    };

    this.treeView = vscode.window.createTreeView(this.id, {
      treeDataProvider: treeProvider,
      canSelectMany: true,
    });
  }
}
