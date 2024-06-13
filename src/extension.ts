import * as vscode from "vscode";
import { Uri } from "vscode";

import { setCommentController, setDiagnosticCollection, setExtensionContext, setExtensionSecretStorage, setExtensionStoragePath, setFileDecorator } from "./config/globals";
import { updateAssay } from "./controller/assayController";
import { AssayCommentController } from "./controller/commentController";
import { getApiKeyFromUser, getSecretFromUser, testApiCredentials } from "./controller/credentialController";
import { openInDiffTool } from "./controller/diffController";
import { lintWorkspace } from "./controller/lintController";
import { setCachedRootFolder, handleRootConfigurationChange } from "./controller/rootController";
import { loadFileDecorator } from "./controller/sidebarController";
import { updateStatusBar } from "./controller/statusBarController";
import revealFile, { getAddonByUrl, handleUri } from "./controller/urlController";
import { CustomFileDecorationProvider } from "./model/fileDecorationProvider";
import { splitUri } from "./utils/helper";
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

  // Configure watchers for the rootFolder.
  const config = vscode.workspace.getConfiguration("assay");
  const rootFolder = config.get<string>("rootFolder");
  setCachedRootFolder(rootFolder);
  const handleRootConfigurationChangeDisposable =
    vscode.workspace.onDidChangeConfiguration(handleRootConfigurationChange);

  // Execute linting.
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("addons-linter");
  setDiagnosticCollection(diagnosticCollection);
  lintWorkspace();

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
      async () => await updateStatusBar()
    ),
    vscode.window.onDidChangeActiveTextEditor(
      async () => await loadFileDecorator()
    ),
    vscode.window.registerFileDecorationProvider(fileDecorator),
    assayUpdaterDisposable,
    handleRootConfigurationChangeDisposable
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
  const cmtController = new AssayCommentController("assay-comments", "Assay");
  setCommentController(cmtController);

  const exportCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.exportCommentsFromContext",
    cmtController.exportVersionComments,
    cmtController
  );

  const deleteCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.deleteCommentsFromContext",
    cmtController.deleteComments,
    cmtController
  );

  const exportCommentDisposable = vscode.commands.registerCommand(
    "assay.exportComments",
    cmtController.exportComments,
    cmtController
  );
  const addCommentDisposable = vscode.commands.registerCommand(
    "assay.addComment",
    cmtController.addComment,
    cmtController
  );
  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    cmtController.deleteThread,
    cmtController
  );
  const cancelSaveCommentDisposable = vscode.commands.registerCommand(
    "assay.cancelSaveComment",
    cmtController.cancelSaveComment,
    cmtController
  );
  const saveCommentDisposable = vscode.commands.registerCommand(
    "assay.saveComment",
    cmtController.saveComment
  );
  const editCommentDisposable = vscode.commands.registerCommand(
    "assay.editComment",
    cmtController.editComment,
    cmtController
  );
  const copyLinkFromReplyDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromReply",
    cmtController.copyLinkFromReply,
    cmtController
  );
  const copyLinkFromThreadDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromThread",
    cmtController.copyLinkFromThread,
    cmtController
  );
  const disposeCommentDisposable = vscode.commands.registerCommand(
    "assay.disposeComment",
    cmtController.dispose,
    cmtController
  );

  context.subscriptions.push(
    cmtController.controller,
    addCommentDisposable,
    deleteCommentDisposable,
    cancelSaveCommentDisposable,
    saveCommentDisposable,
    editCommentDisposable,
    exportCommentDisposable,
    disposeCommentDisposable,
    copyLinkFromReplyDisposable,
    copyLinkFromThreadDisposable,
    exportCommentsFolderDisposable,
    deleteCommentsFolderDisposable
  );
}

export function deactivate() {
  // Nothing to do yet
}
