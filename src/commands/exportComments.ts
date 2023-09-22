import * as vscode from "vscode";

import { getFromCache } from "../utils/addonCache";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function compileComments(fullPath: string) {
  const rootFolder = await getRootFolderPath();
  if (!fullPath.startsWith(rootFolder)) {
    throw new Error("File is not in the root folder");
  }

  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];

  const comments = await getFromCache(guid, [version]);
  let compiledComments = "";

  for (const filepath in comments) {
    for (const lineNumber in comments[filepath]) {
      if (comments[filepath][lineNumber]) {
        compiledComments += `File:\n${filepath.slice(1)}#L${lineNumber}\n\n`;
        const comment = comments[filepath][lineNumber];
        compiledComments += `${comment}\n\n`;
      }
    }
  }

  return compiledComments;
}

export async function exportComments(compiledComments: string) {
  const panel = vscode.window.createWebviewPanel(
    "assay.export",
    "Export Comments",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = await getExportHTML(compiledComments);

  if (compiledComments) {
    vscode.env.clipboard.writeText(compiledComments);
    vscode.window.showInformationMessage("Comments copied to clipboard.");
  }
}

// This one is called from the command palette
export async function exportCommentsFromFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const doc = editor.document;
  const fullPath = doc.uri.fsPath;

  const comments = await compileComments(fullPath);
  await exportComments(comments);
}

// This one is called from the context menu
export async function exportCommentsFromFolderPath(uri: vscode.Uri) {
  const fullPath = uri.fsPath;

  const rootFolder = await getRootFolderPath();
  if (!fullPath.startsWith(rootFolder)) {
    throw new Error("File is not in the root folder");
  }

  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];

  if (!guid || !version) {
    vscode.window.showErrorMessage(
      "Not a valid path. Ensure you are at least as deep as the version folder."
    );
    throw new Error("No guid or version found");
  }

  const comments = await compileComments(fullPath);
  await exportComments(comments);
}

export async function getExportHTML(compiledComments: string) {
  compiledComments = compiledComments ? compiledComments : "No comments found.";
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Export Comments</title>
    </head>
    <body>
        <pre>${compiledComments}</pre>
    </body>
    </html>
    `;
}
