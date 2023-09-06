import * as vscode from "vscode";

import { getLineInfo } from "../utils/lineComment";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function makeComment(extensionURI: vscode.Uri) {
  const lineInfo = getLineInfo();
  if (!lineInfo) {
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "assay.comment",
    "Make a Comment",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "closePanel":
        panel.dispose();
        console.log("comment: ", message.comment);
        return;
    }
  });

  panel.webview.html = await getCommentHTML(lineInfo);
}

export async function getCommentHTML(lineInfo: {
  filepath: string;
  selectedText: string;
  lineStart: number;
  lineEnd: number;
}) {
  const rootDir = await getRootFolderPath();
  const filepath = lineInfo.filepath.replace(rootDir, "");
  const guid = filepath.split("/")[1];
  const version = filepath.split("/")[2];

  return `
  <html>
    <head>
      <title>Make a Comment</title>
    </head>
    <body>
      <h1>Make a Comment</h1>
      <p>GUID: ${guid}</p>
        <p>Version: ${version}</p>
        <p>Filepath: ${filepath.split(version)[1]}</p>
        <p>Line Numbers: ${lineInfo.lineStart}:${lineInfo.lineEnd}</p>
        <p>Selected Text:</p>
        <pre>${lineInfo.selectedText}</pre>
      <p>Comment:</p>
      <textarea id="comment" rows="10" cols="50"></textarea>
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
