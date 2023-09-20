import * as vscode from "vscode";
import { Uri } from "vscode";

import { downloadAndExtract } from "./commands/getAddon";
import { getApiKeyFromUser, getSecretFromUser } from "./commands/getApiCreds";
import { openInDiffTool } from "./commands/launchDiff";
import { loadFileComments } from "./commands/loadComments";
import { makeComment } from "./commands/makeComment";
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

  const reviewDisposable = vscode.commands.registerCommand(
    "assay.review",
    async function (url: string) {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
  );

  const welcomeDisposable = vscode.commands.registerCommand(
    "assay.welcome",
    () => {
      WelcomeView.createOrShow(context.extensionUri);
    }
  );

  const getDisposable = vscode.commands.registerCommand("assay.get", () => {
    downloadAndExtract();
  });

  const apiKeyDisposable = vscode.commands.registerCommand(
    "assay.getApiKey",
    () => {
      getApiKeyFromUser();
    }
  );

  const apiSecretDisposable = vscode.commands.registerCommand(
    "assay.getSecret",
    () => {
      getSecretFromUser();
    }
  );

  const diffDisposable = vscode.commands.registerCommand(
    "assay.openInDiffTool",
    async (_e: Uri, uris?: [Uri, Uri]) => {
      if (!uris) {
        return;
      }
      await openInDiffTool(uris);
    }
  );

  const commentDisposable = vscode.commands.registerCommand(
    "assay.codeComment",
    async () => {
      await makeComment();
    }
  );

  const sidebarDisposable = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  context.subscriptions.push(
    reviewDisposable,
    welcomeDisposable,
    getDisposable,
    apiKeyDisposable,
    apiSecretDisposable,
    diffDisposable,
    commentDisposable,
    sidebarDisposable,
    vscode.window.onDidChangeActiveTextEditor(async () => await updateTaskbar()),
    vscode.window.onDidChangeActiveTextEditor(async () => await loadFileComments()),
  );
}

export function deactivate() {
  // Nothing to do yet
}
