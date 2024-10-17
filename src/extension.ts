import * as vscode from "vscode";

import { AddonCacheController } from "./controller/addonCacheController";
import { AddonController } from "./controller/addonController";
import { CommentCacheController } from "./controller/commentCacheController";
import { CommentController } from "./controller/commentController";
import { CredentialController } from "./controller/credentialController";
import { DiffController } from "./controller/diffController";
import { DirectoryController } from "./controller/directoryController";
import { FileDecoratorController } from "./controller/fileDecoratorController";
import { LintController } from "./controller/lintController";
import { SidebarController } from "./controller/sidebarController";
import { StatusBarController } from "./controller/statusBarController";
import { UrlController } from "./controller/urlController";
import { UpdateHelper } from "./helper/updateHelper";
import { AssayCache } from "./model/assayCache";
import { CustomFileDecorationProvider } from "./model/fileDecorationProvider";
import { AddonTreeItem } from "./model/sidebarTreeDataProvider";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {
  const storagePath: string = context.globalStorageUri.fsPath;
  const reviewsCache = new AssayCache("addonMeta", storagePath);

  // Menu Controllers
  const addonCacheController = new AddonCacheController(reviewsCache);
  const credentialController = new CredentialController(context.secrets);
  const directoryController = new DirectoryController();

  const fileDecorationProvider = new CustomFileDecorationProvider();
  const fileDecoratorController = new FileDecoratorController(
    fileDecorationProvider
  );

  const commentsCache = new AssayCache("comments", storagePath);
  const commentCacheController = new CommentCacheController(
    commentsCache,
    directoryController,
    fileDecoratorController
  );
  const commentController = new CommentController(
    "assay-comments",
    "Assay",
    commentCacheController,
    directoryController
  );

  const rootFolderPath = await directoryController.getRootFolderPath();
  const sidebarController = new SidebarController(
    "assayCommands",
    rootFolderPath
  );
  const sidebarTreeViewDisposable = sidebarController.treeView;

  const sidebarRefreshDisposable = vscode.commands.registerCommand(
    "assay.refresh",
    sidebarController.refresh
  );

  const sidebarDeleteDisposable = vscode.commands.registerCommand(
    "assay.sidebarDelete",
    (treeItem: AddonTreeItem, list: AddonTreeItem[]) => {
      commentController.deleteCommentsFromMenu(treeItem, list);
      sidebarController.delete(treeItem, list);
    }
  );

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("addons-linter");

  const lintController = new LintController(
    diagnosticCollection,
    credentialController,
    addonCacheController,
    directoryController
  );

  const addonController = new AddonController(
    credentialController,
    addonCacheController,
    directoryController,
    sidebarController
  );

  const urlController = new UrlController(
    context,
    addonController,
    directoryController,
    lintController
  );
  const diffController = new DiffController();

  const UriHandlerDisposable = vscode.window.registerUriHandler(urlController);

  const viewAddonDisposable = vscode.commands.registerCommand(
    "assay.viewAddon",
    urlController.viewAddon,
    urlController
  );

  const diffDisposable = vscode.commands.registerCommand(
    "assay.sidebarDiff",
    diffController.diffFromSidebar,
    diffController
  );
  const assayUpdaterDisposable = vscode.commands.registerCommand(
    "assay.checkForUpdates",
    UpdateHelper.updateAssay
  );

  const welcomeDisposable = vscode.commands.registerCommand(
    "assay.welcome",
    () => {
      WelcomeView.createOrShow(context.extensionUri);
    },
    WelcomeView
  );

  const apiKeyDisposable = vscode.commands.registerCommand(
    "assay.getApiKey",
    credentialController.getApiKeyFromUser,
    credentialController
  );

  const apiSecretDisposable = vscode.commands.registerCommand(
    "assay.getSecret",
    credentialController.getSecretFromUser,
    credentialController
  );

  const apiCredentialsTestDisposable = vscode.commands.registerCommand(
    "assay.testApiCredentials",
    credentialController.testApiCredentials,
    credentialController
  );

  const reviewDisposable = vscode.commands.registerCommand(
    "assay.review",
    (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
  );

  const getDisposable = vscode.commands.registerCommand(
    "assay.get",
    urlController.getAddonByUrl,
    urlController
  );

  context.subscriptions.push(
    UriHandlerDisposable,
    reviewDisposable,
    welcomeDisposable,
    getDisposable,
    apiKeyDisposable,
    apiSecretDisposable,
    apiCredentialsTestDisposable,
    sidebarTreeViewDisposable,
    sidebarRefreshDisposable,
    sidebarDeleteDisposable,
    viewAddonDisposable,
    diffDisposable,
    assayUpdaterDisposable
  );

  UpdateHelper.updateAssay(false);

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    false
  );

  // Do not launch commenting system if not in the rootFolder.
  // Still allows Assay to be launched to use other commands (setup, installs).
  const workspace = vscode.workspace.workspaceFolders;
  if (workspace) {
    const uri = workspace[0].uri;
    if (!(await directoryController.inRoot(uri))) {
      return;
    }
  }

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    true
  );

  // Review Controllers
  fileDecorationProvider.setProvideDecorationClause(
    commentCacheController.fileHasComment
  );

  const statusBarController = new StatusBarController(
    addonCacheController,
    directoryController
  );

  urlController.openCachedFile();
  lintController.lintWorkspace();

  const clearLintDisposable = vscode.workspace.onDidSaveTextDocument(
    lintController.clearLintsOnDirty,
    lintController
  );

  const addDirtyOnDeleteDisposable = vscode.workspace.onDidDeleteFiles(
    lintController.clearLintsOnDelete,
    lintController
  );

  const addDirtyOnChangeDisposable = vscode.workspace.onDidChangeTextDocument(
    lintController.toggleDirty,
    lintController
  );

  const removeDirtyDisposable = vscode.workspace.onDidCloseTextDocument(
    lintController.removeDirty,
    lintController
  );

  const fileDecorationProviderDisposable =
    vscode.window.registerFileDecorationProvider(fileDecorationProvider);

  const updateStatusBarController = vscode.window.onDidChangeActiveTextEditor(
    statusBarController.updateStatusBar,
    statusBarController
  );

  const deleteCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.deleteCommentsFromContext",
    commentController.deleteCommentsFromMenu,
    commentController
  );

  const exportCommentDisposable = vscode.commands.registerCommand(
    "assay.exportComments",
    commentController.exportComments,
    commentController
  );

  const addCommentDisposable = vscode.commands.registerCommand(
    "assay.addComment",
    commentController.addComment,
    commentController
  );

  const copyLineNumberDisposable = vscode.commands.registerCommand(
    "assay.copyLineNumber",
    commentController.copyLineNumber,
    commentController
  );

  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    commentController.deleteThread,
    commentController
  );

  const copyLinkFromThreadDisposable = vscode.commands.registerCommand(
    "assay.copyLink",
    commentController.copyLinkFromThread,
    commentController
  );

  const disposeCommentDisposable = vscode.commands.registerCommand(
    "assay.disposeComment",
    commentController.dispose,
    commentController
  );

  context.subscriptions.push(
    updateStatusBarController,
    fileDecorationProviderDisposable,
    commentController.controller,
    addCommentDisposable,
    copyLineNumberDisposable,
    deleteCommentDisposable,
    exportCommentDisposable,
    disposeCommentDisposable,
    copyLinkFromThreadDisposable,
    deleteCommentsFolderDisposable,
    clearLintDisposable,
    addDirtyOnDeleteDisposable,
    addDirtyOnChangeDisposable,
    removeDirtyDisposable
  );
}

export function deactivate() {
  // Nothing to do yet
}
