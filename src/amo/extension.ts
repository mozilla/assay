import * as vscode from "vscode";
import fetch from "node-fetch";
import { downloadAndExtract } from "./commands/fetch";
import { WelcomeView } from "./views/welcomeView";
import { AssayTreeDataProvider } from "./views/sidebarView";

export async function activate(context: vscode.ExtensionContext) {

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  statusBarItem.text = "Assay";

  // Open review page from status bar
  vscode.commands.registerCommand("assay.review", async function (url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });

  vscode.commands.registerCommand("assay.welcome", () => {
    WelcomeView.createOrShow(context.extensionUri);
  });

  const sidebar = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  async function updateTaskbar() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    const doc = activeEditor.document;
    if (doc.uri.scheme !== "file") {
      return;
    }

    const path = doc.uri.fsPath;
    const rootFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!rootFolder) {
      return;
    }
    const relativePath = path.replace(rootFolder, "");
    const pathParts = relativePath.split("/");
    let guid = pathParts[1];
    const version = pathParts[2];

    if (!guid || !version) {
      return;
    }

    if (guid.length === 36 && guid[8] === "-" && guid[13] === "-" && guid[18] === "-" && guid[23] === "-") {
      // looks like a guid
      guid = "{" + guid + "}";
    }

    const reviewUrl = `https://reviewers.addons-dev.allizom.org/en-US/reviewers/review/${guid}`;
    const response = await fetch(reviewUrl);
    if (response.status === 404) {
      return;
    }

    statusBarItem.text = guid + " " + version;
    statusBarItem.tooltip = reviewUrl;
    statusBarItem.command = {
      command: "assay.review",
      arguments: [reviewUrl],
      title: "Review",
    };

    statusBarItem.show();
  }

  context.subscriptions.push(
    downloadAndExtract,
    sidebar,
    vscode.window.onDidChangeActiveTextEditor(updateTaskbar)
  );
}

export function deactivate() {}
