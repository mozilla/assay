import * as vscode from "vscode";
import { Uri } from "vscode";

import { deleteCommentsFromContext } from "./commands/deleteComments";
import { exportVersionComments } from "./commands/exportComments";
import { downloadAndExtract } from "./commands/getAddon";
import {
  getApiKeyFromUser,
  getSecretFromUser,
  testApiCredentials,
} from "./commands/getApiCreds";
import { openInDiffTool } from "./commands/launchDiff";
import { handleUri, openWorkspace } from "./commands/openFromUrl";
import { updateAssay } from "./commands/updateAssay";
import { updateTaskbar } from "./commands/updateTaskbar";
import {
  setCommentManager,
  setExtensionContext,
  setExtensionSecretStorage,
  setExtensionStoragePath,
  setFileDecorator,
} from "./config/globals";
import { CommentManager } from "./utils/commentManager";
import { loadFileDecorator } from "./utils/loadFileDecorator";
import { splitUri } from "./utils/splitUri";
import { CustomFileDecorationProvider } from "./views/fileDecorations";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    return;
  }

  const uri = workspace[0].uri;
  const { rootFolder, fullPath } = await splitUri(uri);

  if (!fullPath.startsWith(rootFolder)) {
    vscode.window.showErrorMessage(
      "(Assay) Launch terminated. Workspace is not in root folder."
    );
    return;
  }

  const storagePath: string = context.globalStorageUri.fsPath;
  const fileDecorator = new CustomFileDecorationProvider();
  setFileDecorator(fileDecorator);
  setExtensionStoragePath(storagePath);
  setExtensionSecretStorage(context.secrets);
  setExtensionContext(context);

  // check if this is a newly opened workspace to open the manifest
  if (context.globalState.get("manifestPath") !== undefined) {
    const manifestPath = context.globalState.get("manifestPath")?.toString();
    await context.globalState.update("manifestPath", undefined);
    if (manifestPath) {
      await openWorkspace(manifestPath);
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
    exportVersionComments
  );

  const deleteCommentsFileDisposable = vscode.commands.registerCommand(
    "assay.deleteCommentsFromContext",
    deleteCommentsFromContext
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
    deleteCommentsFileDisposable,
    vscode.window.registerFileDecorationProvider(fileDecorator),
    assayUpdaterDisposable
  );

  // Comment API
  const cmtManager = new CommentManager("assay-comments", "Assay");
  setCommentManager(cmtManager);

  const exportCommentDisposable = vscode.commands.registerCommand(
    "assay.exportComments",
    cmtManager.exportComments,
    cmtManager
  );
  const addCommentDisposable = vscode.commands.registerCommand(
    "assay.addComment",
    cmtManager.addComment,
    cmtManager
  );
  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    cmtManager.deleteThread,
    cmtManager
  );
  const cancelSaveCommentDisposable = vscode.commands.registerCommand(
    "assay.cancelSaveComment",
    cmtManager.cancelSaveComment,
    cmtManager
  );
  const saveCommentDisposable = vscode.commands.registerCommand(
    "assay.saveComment",
    cmtManager.saveComment
  );
  const editCommentDisposable = vscode.commands.registerCommand(
    "assay.editComment",
    cmtManager.editComment,
    cmtManager
  );

  const disposeCommentDisposable = vscode.commands.registerCommand(
    "assay.disposeComment",
    cmtManager.dispose,
    cmtManager
  );

  context.subscriptions.push(
    cmtManager.controller,
    addCommentDisposable,
    deleteCommentDisposable,
    cancelSaveCommentDisposable,
    saveCommentDisposable,
    editCommentDisposable,
    exportCommentDisposable,
    disposeCommentDisposable
  );
}

export function deactivate() {
  // Nothing to do yet
}
