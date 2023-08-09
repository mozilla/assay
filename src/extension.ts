import * as vscode from "vscode";

import { downloadAndExtract } from "./commands/getAddon";
import { getApiKeyFromUser, getSecretFromUser } from "./commands/getApiCreds";
import { updateTaskbar } from "./commands/updateTaskbar";
import { setExtensionSecretStorage } from "./config/globals";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const storagePath: string = context.globalStorageUri.fsPath;
  setExtensionSecretStorage(context.secrets);

  vscode.commands.registerCommand("assay.review", async function (url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });

  vscode.commands.registerCommand("assay.welcome", () => {
    WelcomeView.createOrShow(context.extensionUri);
  });

  vscode.commands.registerCommand("assay.get", () => {
    downloadAndExtract(storagePath);
  });

  vscode.commands.registerCommand("assay.getApiKey", () => {
    getApiKeyFromUser();
  });

  vscode.commands.registerCommand("assay.getSecret", () => {
    getSecretFromUser();
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
