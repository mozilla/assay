import * as vscode from "vscode";
import { Uri } from "vscode";

import { AddonController } from "./controller/addonController";
import { CommentCacheController } from "./controller/commentCacheController";
import { CommentController } from "./controller/commentController";
import { CredentialController } from "./controller/credentialController";
import { DiffController } from "./controller/diffController";
import { FileDecoratorController } from "./controller/fileDecoratorController";
import { LintController } from "./controller/lintController";
import { ReviewCacheController } from "./controller/reviewCacheController";
import { RootController } from "./controller/rootController";
import { StatusBarController } from "./controller/statusBarController";
import { UpdateController } from "./controller/updateController";
import { UrlController } from "./controller/urlController";
import { CustomFileDecorationProvider } from "./model/fileDecorationProvider";
import { splitUri } from "./utils/helper";
import { AssayTreeDataProvider } from "./views/sidebarView";
import { WelcomeView } from "./views/welcomeView";

export async function activate(context: vscode.ExtensionContext) {

  const storagePath: string = context.globalStorageUri.fsPath;
  const assayConfig = vscode.workspace.getConfiguration("assay");
  const fileConfig = vscode.workspace.getConfiguration("files");

  // always launched
  const reviewCacheController = new ReviewCacheController("reviewMeta", storagePath);
  const credentialController = new CredentialController(context.secrets);
  const rootController = new RootController(assayConfig, fileConfig);
  const addonController = new AddonController(credentialController, reviewCacheController, rootController);
  const urlController = new UrlController(context, addonController, rootController);
  const updateController = new UpdateController();

  // listen for vscode://publisher.assay/ links
  const UriHandlerDisposable = vscode.window.registerUriHandler(urlController);

  const assayUpdaterDisposable = vscode.commands.registerCommand(
    "assay.checkForUpdates",
    updateController.updateAssay,
    updateController
  );

  const reviewDisposable = vscode.commands.registerCommand(
    "assay.review",
    (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
  );

  const welcomeDisposable = vscode.commands.registerCommand(
    "assay.welcome",
    () => {
      WelcomeView.createOrShow(context.extensionUri);
    },
    WelcomeView
  );

  const getDisposable = vscode.commands.registerCommand(
    "assay.get",
    urlController.getAddonByUrl,
    urlController
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

  const sidebarDisposable = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  // Configure watchers for the rootFolder.
  const handleRootConfigurationChangeDisposable =
    vscode.workspace.onDidChangeConfiguration(rootController.handleRootConfigurationChange, rootController);

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
    const { rootFolder, fullPath } = await splitUri(uri);
    if (!fullPath.startsWith(rootFolder)) {
      return;
    }
  }

  await vscode.commands.executeCommand(
    "setContext",
    "assay.commentsEnabled",
    true
  );

  // active review controllers
  const fileDecorationProvider = new CustomFileDecorationProvider();
  const fileDecoratorController = new FileDecoratorController(fileDecorationProvider);
  const commentCacheController = new CommentCacheController("comments", rootController, fileDecoratorController, storagePath);
  fileDecorationProvider.setProvideDecorationClause(commentCacheController.fileHasComment);

  const lintController = new LintController("addons-linter", credentialController, reviewCacheController);
  const commentController = new CommentController("assay-comments", "Assay", commentCacheController);
  const statusBarController = new StatusBarController(reviewCacheController, rootController);
  const diffController = new DiffController();

  // load comments on startup/reload
  await fileDecoratorController.loadFileDecorator();

  // If a filePath exists, a version folder was just opened. Open the manifest.
  if (context.globalState.get("filePath") !== undefined) {
    const filePath = context.globalState.get("filePath")?.toString();
    const lineNumber = context.globalState.get("lineNumber")?.toString();
    await context.globalState.update("filePath", undefined);
    await context.globalState.update("lineNumber", undefined);
    if (filePath) {
      urlController.revealFile(vscode.Uri.file(filePath), lineNumber);
    }
  }

  const diffDisposable = vscode.commands.registerCommand(
    "assay.openInDiffTool",
    async (_e: Uri, uris?: [Uri, Uri]) => {
      if (!uris) {
        return;
      }
      await diffController.openInDiffTool(uris);
    },
    diffController
  );
  
  const updateStatusBarController = vscode.window.onDidChangeActiveTextEditor(
      statusBarController.updateStatusBar,
      statusBarController
  );
  
  const loadFileDecoratorController = vscode.window.onDidChangeActiveTextEditor(
    fileDecoratorController.loadFileDecorator,
    fileDecoratorController
  );
 
  const fileDecorationProviderDisposable = vscode.window.registerFileDecorationProvider(fileDecorationProvider);

  // Execute linting.
  lintController.lintWorkspace(); 

  context.subscriptions.push(
    diffDisposable,
    updateStatusBarController,
    loadFileDecoratorController,
    fileDecorationProviderDisposable
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
