import * as vscode from "vscode";
import { Uri } from "vscode";

import { downloadAndExtract } from "./commands/getAddon";
import { getApiKeyFromUser, getSecretFromUser } from "./commands/getApiCreds";
import { updateTaskbar } from "./commands/updateTaskbar";
import {
  setExtensionSecretStorage,
  setExtensionStoragePath,
} from "./config/globals";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const storagePath: string = context.globalStorageUri.fsPath;
  setExtensionStoragePath(storagePath);
  setExtensionSecretStorage(context.secrets);

  vscode.commands.registerCommand("assay.review", async function (url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });

  vscode.commands.registerCommand("assay.welcome", () => {
    WelcomeView.createOrShow(context.extensionUri);
  });

  vscode.commands.registerCommand("assay.get", () => {
    downloadAndExtract();
  });

  vscode.commands.registerCommand("assay.getApiKey", () => {
    getApiKeyFromUser();
  });

  vscode.commands.registerCommand("assay.getSecret", () => {
    getSecretFromUser();
  });

  vscode.commands.registerCommand(
    "assay.openInDiffTool",
    async (_e: Uri, uris?: [Uri, Uri]) => {
      if (!uris) {
        return;
      }
      const [left, right] = uris;
      const leftUri = vscode.Uri.parse(left.toString());
      const rightUri = vscode.Uri.parse(right.toString());
      const leftPath = leftUri.fsPath;
      const rightPath = rightUri.fsPath;

      const config = vscode.workspace.getConfiguration("assay");
      let diffCommand = config.get<string>("diffTool");


      if (!diffCommand) {
        const input = await vscode.window.showInputBox({
          prompt: "Please enter your diff tool command (e.g. diff -rq).",
        });
        if (!input) {
          return;
        }
        await config.update("diffTool", input, true);
        diffCommand = input;
      }


      const terminal = vscode.window.createTerminal("External Diff Tool");
      terminal.sendText(`${diffCommand} ${leftPath} ${rightPath}`);
      terminal.show();
    }
  );

  const sidebar = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  context.subscriptions.push(
    sidebar,
    vscode.window.onDidChangeActiveTextEditor(() => updateTaskbar())
  );
}

export function deactivate() {
  // Nothing to do yet
}
