import * as vscode from "vscode";

export class AssayTreeDataProvider
  implements vscode.TreeDataProvider<AssayTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<AssayTreeItem | undefined> =
    new vscode.EventEmitter<AssayTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<AssayTreeItem | undefined> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: AssayTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AssayTreeItem): Thenable<AssayTreeItem[]> {
    if (!element) {
      const treeTabs: AssayTreeItem[] = [
        new AssayTreeItem(
          "Commands",
          vscode.TreeItemCollapsibleState.Collapsed
        ),
      ];
      return Promise.resolve(treeTabs);
    }

    if (element.label === "Commands") {
      const tabItems: AssayTreeItem[] = [
        new AssayTreeItem(
          "Review New Addon Version",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.get",
            title: "Download and Extract Addon",
          }
        ),
        new AssayTreeItem(
          "View Documentation",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.welcome",
            title: "View Assay Documentation",
          }
        ),
      ];
      return Promise.resolve(tabItems);
    }

    return Promise.resolve([]);
  }
}

export class AssayTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState?: vscode.TreeItemCollapsibleState,
    commamnd?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.command = commamnd;
  }
}
