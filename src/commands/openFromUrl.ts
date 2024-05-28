import * as fs from "fs";
import * as vscode from "vscode";

import { downloadAndExtract } from "./getAddon";
import { getExtensionContext } from "../config/globals";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function openWorkspace(versionPath: string, filepath?: string) {
  const versionUri = vscode.Uri.file(versionPath);
  const manifestPath = `${versionPath}/${filepath ?? "manifest.json"}`;
  const workspace = vscode.workspace.workspaceFolders;

  // If user already has the version folder opened, open the manifest.json
  if (workspace && workspace[0].uri.fsPath === versionUri.fsPath) {
    await vscode.window.showTextDocument(vscode.Uri.file(manifestPath));
  }
  // Otherwise, store the manifestPath (since the extension must restart) to open on launch.
  else {
    const context = getExtensionContext();
    await context.globalState.update("manifestPath", manifestPath);
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
filepath?: string
) {
  const rootPath = await getRootFolderPath();
  const versionPath = `${rootPath}/${guid}/${version}`;
  try {
    await fs.promises.stat(versionPath);
  } catch (error) {
    await downloadAndExtract(guid, version);
  }
  await openWorkspace(versionPath, filepath);
}

// handles vscode://mozilla.assay/... urls
export async function handleUri(uri: vscode.Uri) {
  const { path, query } = uri;
  const filepath = new URLSearchParams(query).get("path");
  const [_, action, ...rest] = path.split("/");
  if (action === "review") {
    const [guid, version] = rest;
    await handleReviewUrl(guid, version, filepath || undefined);
  }
}