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
          "Enter API Key",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.getApiKey",
            title: "Enter AMO API Key",
          }
        ),
        new AssayTreeItem(
          "Enter API Secret",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.getSecret",
            title: "Enter AMO API Secret",
          }
        ),
        new AssayTreeItem(
          "Test API Credentials",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.testApiCredentials",
            title: "Test AMO Credentials",
          }
        ),
        new AssayTreeItem(
          "View Instructions",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.welcome",
            title: "View Assay Documentation",
          }
        ),
        new AssayTreeItem(
          "Lint AMO Addon Locally",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.lintLocally",
            title: "Lint Addon Locally",
          }
        ),
        new AssayTreeItem(
          "Lint AMO Addon Via API",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "assay.lintApi",
            title: "Lint Addon API",
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
