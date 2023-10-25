import * as vscode from "vscode";

import { loadFileComments } from "./loadComments";
import { addToCache, getFromCache } from "../utils/addonCache";
import { getLineInfo } from "../utils/lineComment";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function makePanel(
  guid: string,
  version: string,
  filepath: string,
  lineNumber: string,
  existingComment: string
) {
  const panel = vscode.window.createWebviewPanel(
    "assay.comment",
    "Make a Comment",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  panel.webview.onDidReceiveMessage(async (message) => {
    panel.dispose();
    const pathParts = filepath.split("/").slice(1);
    await addToCache(
      guid,
      [version, ...pathParts, lineNumber],
      message.comment
    );
    await loadFileComments();
  });

  panel.webview.html = await getCommentHTML(
    guid,
    version,
    filepath,
    lineNumber,
    existingComment
  );
}

export async function makeComment() {
  const lineInfo = getLineInfo();
  if (!lineInfo) {
    return;
  }
  const fullpath = lineInfo.fullpath;
  const lineNumber = lineInfo.lineNumber;

  const rootDir = await getRootFolderPath();
  const relativePath = fullpath.replace(rootDir, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];
  const filepath = relativePath.split(version)[1];
  const keys = relativePath.split("/").slice(2);

  const existingComment = await getFromCache(guid, [...keys, lineNumber]);

  await makePanel(guid, version, filepath, lineNumber, existingComment);
}

export async function getCommentHTML(
  guid: string,
  version: string,
  filepath: string,
  lineNumber: string,
  existingComment: string
) {
  return `
  <html>
    <head>
      <title>Make a Comment</title>
    </head>
    <body>
      <h1>Make a Comment</h1>
      <p>GUID: ${guid} | VERSION: ${version}</p>
        <p>FILEPATH: ${filepath} | LINE NUMBER: ${lineNumber}</p>
      <p>Comment:</p>
      <textarea id="comment" rows="10" cols="50">${
        existingComment || ""
      }</textarea>
        <br />
      <button id="submit">Submit</button>
      <script>
        const vscode = acquireVsCodeApi();
        const submitButton = document.getElementById("submit");
        const comment = document.getElementById("comment");
        submitButton.addEventListener("click", () => {
            vscode.postMessage({ command: 'closePanel', comment: comment.value});
        });
      </script>
    </body>
  </html>
  `;
}
