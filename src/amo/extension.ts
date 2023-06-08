import * as vscode from "vscode";
import fetch from "node-fetch";
import { downloadAndExtract } from "./commands/getAddon";
import { WelcomeView } from "./views/welcomeView";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const storagePath: string = context.globalStorageUri.fsPath;

  vscode.commands.registerCommand("assay.review", async function (url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });

  vscode.commands.registerCommand("assay.welcome", () => {
    WelcomeView.createOrShow(context.extensionUri);
  });

  const sidebar = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  vscode.commands.registerCommand("assay.get", () => {
    downloadAndExtract(storagePath);
  });

  context.subscriptions.push(
    sidebar,
    vscode.window.onDidChangeActiveTextEditor(() => updateTaskbar(storagePath))
  );
}

export function deactivate() {
  // Nothing to do yet
}
