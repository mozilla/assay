import * as vscode from "vscode";

import { downloadAndExtract } from "./commands/getAddon";
import { updateTaskbar } from "./commands/updateTaskbar";
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

  vscode.commands.registerCommand("assay.get", () => {
    downloadAndExtract(storagePath);
  });

  const sidebar = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  context.subscriptions.push(
    sidebar,
    vscode.window.onDidChangeActiveTextEditor(() => updateTaskbar(storagePath))
  );
}

export function deactivate() {
  // Nothing to do yet
}
