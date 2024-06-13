import * as fs from "fs";
import * as vscode from "vscode";

import { downloadAndExtract } from "./addonController";
import { getRootFolderPath } from "./rootController";
import { getExtensionContext } from "../config/globals";
import { stringToRange } from "../utils/helper";

export async function openWorkspace(
  versionPath: string,
  filepath?: string,
  lineNumber?: string
) {
  const versionUri = vscode.Uri.file(versionPath);
  const filePath = `${versionPath}/${filepath ?? "manifest.json"}`;
  const workspace = vscode.workspace.workspaceFolders;

  // If user already has the version folder opened, open the manifest.json
  if (workspace && workspace[0].uri.fsPath === versionUri.fsPath) {
    revealFile(vscode.Uri.file(filePath), lineNumber);
  }
  // Otherwise, store the filePath (since the extension must restart) to open on launch.
  else {
    const context = getExtensionContext();
    await context.globalState.update("filePath", filePath);
    if (lineNumber) {
      await context.globalState.update("lineNumber", lineNumber);
    }
    vscode.commands.executeCommand("vscode.openFolder", versionUri, true);
  }
}

// handles assay.get input
export async function getAddonByUrl() {
  const result = await downloadAndExtract();
  if (!result) {
    return;
  }
  const { workspaceFolder, guid, version } = result;
  const versionPath = `${workspaceFolder}/${guid}/${version}`;
  await openWorkspace(versionPath);
}

// handles urls of the form /review/<guid>/<version>?path=<file>
export async function handleReviewUrl(
  guid: string,
  version: string,
  filepath?: string,
  lineNumber?: string
) {
  const rootPath = await getRootFolderPath();
  const versionPath = `${rootPath}/${guid}/${version}`;
  try {
    await fs.promises.stat(versionPath);
  } catch (error) {
    await downloadAndExtract(guid, version);
  }
  await openWorkspace(versionPath, filepath, lineNumber);
}

// handles vscode://mozilla.assay/... urls
export async function handleUri(uri: vscode.Uri) {
  const { path, query, fragment } = uri;
  const filepath = new URLSearchParams(query).get("path");
  const lineNumber = filepath ? `#${fragment}` : undefined;

  const [_, action, ...rest] = path.split("/");
  if (action === "review") {
    const [guid, version] = rest;
    await handleReviewUrl(guid, version, filepath || undefined, lineNumber);
  }
}


export default async function revealFile(uri: vscode.Uri, lineNumber?: string) {
  const editor = await vscode.window.showTextDocument(uri);
  if (lineNumber) {
    // highlight offending lines
    const lineRange = await stringToRange(lineNumber, uri);
    const selection = new vscode.Selection(lineRange.start, lineRange.end);
    editor.selections = [selection];
    // move editor to focus on line(s)
    editor.revealRange(lineRange, vscode.TextEditorRevealType.InCenter);
  }
}