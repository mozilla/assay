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
import { RangeController } from "./controller/rangeController";
import { StatusBarController } from "./controller/statusBarController";
import { UpdateController } from "./controller/updateController";
import { UrlController } from "./controller/urlController";
import { AssayCache } from "./model/cache";
import { CustomFileDecorationProvider } from "./model/fileDecorationProvider";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {

  const storagePath: string = context.globalStorageUri.fsPath;
  const assayConfig = vscode.workspace.getConfiguration("assay");
  const fileConfig = vscode.workspace.getConfiguration("files");
  const reviewsCache = new AssayCache("reviewMeta", storagePath);

  // Menu Controllers
  const addonCacheController = new AddonCacheController(reviewsCache);
  const credentialController = new CredentialController(context.secrets);
  const directoryController = new DirectoryController(assayConfig, fileConfig);
  const rangeController = new RangeController(directoryController);

  const addonController = new AddonController(credentialController, addonCacheController, directoryController);
  const urlController = new UrlController(context, addonController, directoryController, rangeController);
  const updateController = new UpdateController();
  const diffController = new DiffController();

  const UriHandlerDisposable = vscode.window.registerUriHandler(urlController);

  const sidebarDisposable = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  const assayUpdaterDisposable = vscode.commands.registerCommand(
    "assay.checkForUpdates",
    updateController.updateAssay,
    updateController
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

  const handleRootConfigurationChangeDisposable =
    vscode.workspace.onDidChangeConfiguration(directoryController.handleRootConfigurationChange, directoryController);

  context.subscriptions.push(
    UriHandlerDisposable,
    reviewDisposable,
    welcomeDisposable,
    getDisposable,
    apiKeyDisposable,
    apiSecretDisposable,
    apiCredentialsTestDisposable,
    sidebarDisposable,
    assayUpdaterDisposable,
    handleRootConfigurationChangeDisposable
  );

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
    if(!directoryController.inRoot(uri)){
      return;

    }
  }

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    true
  );

  const commentsCache = new AssayCache("comments", storagePath);

  // Review Controllers
  const fileDecorationProvider = new CustomFileDecorationProvider();
  const fileDecoratorController = new FileDecoratorController(fileDecorationProvider);
  const commentCacheController = new CommentCacheController(commentsCache, directoryController, fileDecoratorController, rangeController);
  fileDecorationProvider.setProvideDecorationClause(commentCacheController.fileHasComment);

  const lintController = new LintController("addons-linter", credentialController, addonCacheController, directoryController);
  const commentController = new CommentController("assay-comments", "Assay", commentCacheController, directoryController, rangeController);
  const statusBarController = new StatusBarController(addonCacheController, directoryController);

  urlController.openCachedFile();
  lintController.lintWorkspace(); 

  const fileDecorationProviderDisposable = vscode.window.registerFileDecorationProvider(fileDecorationProvider);

  const updateStatusBarController = vscode.window.onDidChangeActiveTextEditor(
    statusBarController.updateStatusBar,
    statusBarController
  );

  const diffDisposable = vscode.commands.registerCommand(
    "assay.openInDiffTool",
    async (_e: vscode.Uri, uris?: [vscode.Uri, vscode.Uri]) => {
      if (!uris) {
        return;
      }
      await diffController.openInDiffTool(uris);
    },
    diffController
  );

  const exportCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.exportCommentsFromContext",
    commentCacheController.exportVersionComments,
    commentCacheController
  );

  const deleteCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.deleteCommentsFromContext",
    commentCacheController.deleteComments,
    commentCacheController
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

  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    commentController.deleteThread,
    commentController
  );

  const cancelSaveCommentDisposable = vscode.commands.registerCommand(
    "assay.cancelSaveComment",
    commentController.cancelSaveComment,
    commentController
  );

  const saveCommentDisposable = vscode.commands.registerCommand(
    "assay.saveComment",
    commentController.saveComment
  );

  const editCommentDisposable = vscode.commands.registerCommand(
    "assay.editComment",
    commentController.editComment,
    commentController
  );

  const copyLinkFromReplyDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromReply",
    commentController.copyLinkFromReply,
    commentController
  );

  const copyLinkFromThreadDisposable = vscode.commands.registerCommand(
    "assay.copyLinkFromThread",
    commentController.copyLinkFromThread,
    commentController
  );

  const disposeCommentDisposable = vscode.commands.registerCommand(
    "assay.disposeComment",
    commentController.dispose,
    commentController
  );

  context.subscriptions.push(
    diffDisposable,
    updateStatusBarController,
    fileDecorationProviderDisposable,
    commentController.controller,
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
