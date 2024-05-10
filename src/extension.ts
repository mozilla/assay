import * as vscode from "vscode";
import { Uri } from "vscode";

import { addComment, cancelSaveComment, deleteComment, editComment, saveComment } from "./commands/comment";
import { removeCommentFromCurrentLine } from "./commands/deleteComment";
import {
  exportCommentsFromFile,
  exportCommentsFromFolderPath,
} from "./commands/exportComments";
import { downloadAndExtract } from "./commands/getAddon";
import { getApiKeyFromUser, getSecretFromUser, testApiCredentials } from "./commands/getApiCreds";
import { openInDiffTool } from "./commands/launchDiff";
import { loadFileComments } from "./commands/loadComments";
import { makeComment } from "./commands/makeComment";
import { handleUri, openWorkspace } from "./commands/openFromUrl";
import { changeVerdict, selectVerdict } from "./commands/promptVerdict";
import { updateAssay } from "./commands/updateAssay";
import { updateTaskbar } from "./commands/updateTaskbar";
import {
  setExtensionContext,
  setExtensionSecretStorage,
  setExtensionStoragePath,
  setFileDecorator,
} from "./config/globals";
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

  // check if this is a newly opened workspace to open the manifest
  if (context.globalState.get("manifestPath") !== undefined) {
    const manifestPath = context.globalState.get("manifestPath")?.toString();
    await context.globalState.update("manifestPath", undefined);
    if (manifestPath) {
      await openWorkspace(manifestPath);
    }
  }

  // load comments on startup/reload
  await loadFileComments();

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

  const commentDisposable = vscode.commands.registerCommand(
    "assay.codeComment",
    async () => {
      await makeComment();
    }
  );

  const sidebarDisposable = vscode.window.createTreeView("assayCommands", {
    treeDataProvider: new AssayTreeDataProvider(),
  });

  const exportCommentsFileDisposable = vscode.commands.registerCommand(
    "assay.exportCommentsFromFile",
    async () => {
      await exportCommentsFromFile();
    }
  );

  const exportCommentsFolderDisposable = vscode.commands.registerCommand(
    "assay.exportCommentsFromFolder",
    async (uri: Uri) => {
      await exportCommentsFromFolderPath(uri);
    }
  );

  const deleteCommentDisposable = vscode.commands.registerCommand(
    "assay.deleteComment",
    async () => {
      await removeCommentFromCurrentLine();
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
    commentDisposable,
    sidebarDisposable,
    vscode.window.onDidChangeActiveTextEditor(
      async () => await updateTaskbar()
    ),
    vscode.window.onDidChangeActiveTextEditor(
      async () => await loadFileComments()
    ),
    exportCommentsFileDisposable,
    exportCommentsFolderDisposable,
    vscode.window.registerFileDecorationProvider(fileDecorator),
    deleteCommentDisposable,
    assayUpdaterDisposable
  );

  // Comment API

  const commentController = vscode.comments.createCommentController('assay-comments', 'Assay');
  
  commentController.commentingRangeProvider = {
    provideCommentingRanges: (document: vscode.TextDocument) => {
			const lineCount = document.lineCount;
			return [new vscode.Range(0, 0, lineCount - 1, 0)];
		}
  };

  vscode.commands.registerCommand('assay-test.selectVerdict', selectVerdict);
  vscode.commands.registerCommand('assay-test.changeVerdict', selectVerdict);

  const addCommentDisposable = vscode.commands.registerCommand('assay-test.addComment', addComment);
  const deleteCommentDisposable2 = vscode.commands.registerCommand('assay-test.deleteComment', deleteComment);
  const cancelSaveCommentDisposable = vscode.commands.registerCommand('assay-test.cancelSaveComment', cancelSaveComment);
  const saveCommentDisposable = vscode.commands.registerCommand('assay-test.saveComment', saveComment);
  const editCommentDisposable = vscode.commands.registerCommand('assay-test.editComment', editComment);

  vscode.commands.registerCommand('assay-test.disposeComment', () => {
		commentController.dispose();
	});

  context.subscriptions.push(
    commentController, 
    addCommentDisposable, 
    deleteCommentDisposable2, 
    cancelSaveCommentDisposable, 
    saveCommentDisposable, 
    editCommentDisposable
  );

}

export function deactivate() {
  // Nothing to do yet
}
