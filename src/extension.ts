import * as vscode from "vscode";
import { Uri } from "vscode";

import { exportCommentsFromContext } from "./commands/exportComments";
import {
  getApiKeyFromUser,
  getSecretFromUser,
  testApiCredentials,
} from "./commands/getApiCreds";
import { openInDiffTool } from "./commands/launchDiff";
import { getAddonByUrl, handleUri } from "./commands/openFromUrl";
import { updateAssay } from "./commands/updateAssay";
import { updateTaskbar } from "./commands/updateTaskbar";
import {
  setExtensionContext,
  setExtensionSecretStorage,
  setExtensionStoragePath,
  setFileDecorator,
} from "./config/globals";
import { commentManager } from "./utils/commentManager";
import { loadFileDecorator } from "./utils/loadFileDecorator";
import revealFile from "./utils/revealFile";
import { splitUri } from "./utils/splitUri";
import { CustomFileDecorationProvider } from "./views/fileDecorations";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const storagePath: string = context.globalStorageUri.fsPath;
  const fileDecorator = new CustomFileDecorationProvider();
  setFileDecorator(fileDecorator);
  setExtensionStoragePath(storagePath);
  setExtensionSecretStorage(context.secrets);
  setExtensionContext(context);

  // If a filePath exists, a version folder was just opened. Open the manifest.
  if (context.globalState.get("filePath") !== undefined) {
    const filePath = context.globalState.get("filePath")?.toString();
    const lineNumber = context.globalState.get("lineNumber")?.toString();
    console.log("hi", lineNumber);
    await context.globalState.update("filePath", undefined);
    await context.globalState.update("lineNumber", undefined);
    if (filePath) {
      revealFile(vscode.Uri.file(filePath), lineNumber);
    }
  }

  // load comments on startup/reload
  await loadFileDecorator();

  // listen for vscode://publisher.assay/ links
  const UriHandlerDisposable = vscode.window.registerUriHandler({
    handleUri,
  });

  const assayUpdaterDisposable = vscode.commands.registerCommand(
    "assay.checkForUpdates",
    async () => {
      await updateAssay();
    }
  );

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

  const getDisposable = vscode.commands.registerCommand(
    "assay.get",
    getAddonByUrl
  );

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

  const apiCredentialsTestDisposable = vscode.commands.registerCommand(
    "assay.testApiCredentials",
    () => {
      testApiCredentials();
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

  const sidebarDisposable = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  const exportCommentsFileDisposable = vscode.commands.registerCommand(
    "assay.exportCommentsFromContext",
    async () => {
      await exportCommentsFromContext();
    }
  );

  context.subscriptions.push(
    UriHandlerDisposable,
    reviewDisposable,
    welcomeDisposable,
    getDisposable,
    apiKeyDisposable,
    apiSecretDisposable,
    apiCredentialsTestDisposable,
    diffDisposable,
    sidebarDisposable,
    vscode.window.onDidChangeActiveTextEditor(
      async () => await updateTaskbar()
    ),
    vscode.window.onDidChangeActiveTextEditor(
      async () => await loadFileDecorator()
    ),
    exportCommentsFileDisposable,
    vscode.window.registerFileDecorationProvider(fileDecorator),
    assayUpdaterDisposable
  );

  // Comment API

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    false
  );

  const workspace = vscode.workspace.workspaceFolders;
  if (workspace) {
    const uri = workspace[0].uri;
    const { rootFolder, fullPath } = await splitUri(uri);
    // Do not launch commenting system if not in the rootFolder.
    // Still allows Assay to be launched to use other commands (setup, installs).
    if (!fullPath.startsWith(rootFolder)) {
      return;
    }
  }

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    true
  );
  const cmtManager = new commentManager("assay-comments", "Assay");
  const exportCommentDisposable = vscode.commands.registerCommand(
    "assay.exportComments",
    cmtManager.exportComments
  );
  const addCommentDisposable = vscode.commands.registerCommand(
    "assay.addComment",
    cmtManager.addComment
  );
  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    cmtManager.deleteThread
  );
  const cancelSaveCommentDisposable = vscode.commands.registerCommand(
    "assay.cancelSaveComment",
    cmtManager.cancelSaveComment
  );
  const saveCommentDisposable = vscode.commands.registerCommand(
    "assay.saveComment",
    cmtManager.saveComment
  );
  const editCommentDisposable = vscode.commands.registerCommand(
    "assay.editComment",
    cmtManager.editComment
  );
  const copyLinkFromReplyDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromReply",
    cmtManager.copyLinkFromReply,
    cmtManager
  );
  const copyLinkFromThreadDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromThread",
    cmtManager.copyLinkFromThread,
    cmtManager
  );
  const disposeCommentDisposable = vscode.commands.registerCommand(
    "assay.disposeComment",
    cmtManager.dispose
  );

  context.subscriptions.push(
    cmtManager.controller,
    addCommentDisposable,
    deleteCommentDisposable,
    cancelSaveCommentDisposable,
    saveCommentDisposable,
    editCommentDisposable,
    exportCommentDisposable,
    disposeCommentDisposable,
    copyLinkFromReplyDisposable,
    copyLinkFromThreadDisposable
  );
}

export function deactivate() {
  // Nothing to do yet
}
