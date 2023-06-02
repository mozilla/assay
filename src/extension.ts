import * as vscode from "vscode";
import { downloadAndExtract } from "./command/fetch";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  // Open review page from status bar
  vscode.commands.registerCommand("assay.review", async function (url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });

  vscode.commands.registerCommand("assay.welcome", () => {
    WelcomeView.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(downloadAndExtract);
}

export function deactivate() {}
