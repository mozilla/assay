import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Does not use resourceUri to avoid fileDecorationProvider providing to this tree.
export class AddonTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly uri: vscode.Uri,
    public readonly contextValue: string | undefined,
    showIcon?: boolean
  ) {
    super(label, collapsibleState);
    this.iconPath = showIcon
      ? {
          dark: path.join(
            __filename,
            "..",
            "..",
            "media",
            "sidebarIcons",
            "puzzle_inverse.svg"
          ),
          light: path.join(
            __filename,
            "..",
            "..",
            "media",
            "sidebarIcons",
            "puzzle.svg"
          ),
        }
      : undefined;
  }
}

export class AddonTreeDataProvider
  implements vscode.TreeDataProvider<AddonTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<AddonTreeItem | undefined> =
    new vscode.EventEmitter<AddonTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<AddonTreeItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private rootPath: string) {}

  getTreeItem(element: AddonTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AddonTreeItem): Thenable<AddonTreeItem[]> {
    const itemPath = element?.uri ? element.uri.fsPath : this.rootPath;
    const depth = itemPath.split(this.rootPath)?.at(1)?.split("/").length;
    return new Promise((resolve) => {
      fs.readdir(itemPath, (err, files) => {
        if (err || !depth || depth > 2) {
          return resolve([]);
        }

        const children: AddonTreeItem[] = [];
        files.map((file) => {
          const filePath = path.join(itemPath, file);
          const isDirectory = fs.statSync(filePath).isDirectory();
          if (isDirectory) {
            const isGuidFolder = depth < 2;
            const contextValue = isGuidFolder ? "guidDirectory" : undefined;
            const collapsibleState = isGuidFolder
              ? vscode.TreeItemCollapsibleState.Expanded
              : vscode.TreeItemCollapsibleState.None;
            children.push(
              new AddonTreeItem(
                file,
                collapsibleState,
                vscode.Uri.file(filePath),
                contextValue,
                isGuidFolder
              )
            );
          }
        });
        return resolve(children);
      });
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}
