import * as vscode from "vscode";

import { AddonTreeDataProvider } from "../model/sidebarTreeDataProvider";
import { TypeOption } from "../types";

export class SidebarController {
  public refresh: () => void;
  public xpiTreeView: vscode.TreeView<vscode.TreeItem>;
  public srcTreeView: vscode.TreeView<vscode.TreeItem>;

  constructor(public xpiID: string, public srcID: string, rootFolderPath: string) {
    const srcTreeProvider = new AddonTreeDataProvider(`${rootFolderPath}/${TypeOption.Source}`);
    const xpiTreeProvider = new AddonTreeDataProvider(`${rootFolderPath}/${TypeOption.Xpi}`);

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
}
