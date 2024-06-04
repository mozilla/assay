import * as vscode from "vscode";

import { getCommentManager } from "../config/globals";
import { getFromCache } from "../utils/addonCache";
import getDeleteCommentsPreference from "../utils/getDeleteCommentsPreference";
import { rangeTruncation } from "../utils/getThreadLocation";
import { splitUri } from "../utils/splitUri";

export async function compileComments(guid: string, version: string) {
  const comments = await getFromCache("comments", [guid, version]);
  let compiledComments = "";

  for (const filepath in comments) {
    for (const lineNumber in comments[filepath]) {
      compiledComments += `File:\n${filepath}${rangeTruncation(
        lineNumber
      )}\n\n`;
      const comment = comments[filepath][lineNumber].body;
      compiledComments += `${comment}\n\n`;
    }
  }
  return compiledComments;
}

export async function exportCommentsFromContext() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const doc = editor.document;
  await exportVersionComments(doc.uri);
}

export async function exportVersionComments(uri: vscode.Uri) {
  const { rootFolder, fullPath, guid, version } = await splitUri(uri);
  if (!fullPath.startsWith(rootFolder)) {
    vscode.window.showErrorMessage(
      "(Assay) File is not in the Addons root folder."
    );
    throw new Error("File is not in the root folder");
  }

  if (!guid || !version) {
    vscode.window.showErrorMessage(
      "Not a valid path. Ensure you are at least as deep as the version folder."
    );
    throw new Error("No guid or version found");
  }

  const comments = await compileComments(guid, version);
  await exportComments(comments, uri);
}

export async function exportComments(
  compiledComments: string,
  uri: vscode.Uri
) {
  const document = await vscode.workspace.openTextDocument({
    content: compiledComments,
    language: "text",
  });

  vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);

  if (compiledComments) {
    vscode.env.clipboard.writeText(compiledComments);
    vscode.window.showInformationMessage("Comments copied to clipboard.");
  }

  const deleteCachedComments = await getDeleteCommentsPreference();
  if (deleteCachedComments) {
    const cmtManager = getCommentManager();
    await cmtManager.deleteComments(uri);
  }
}
