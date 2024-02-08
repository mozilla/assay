import * as fs from "fs";
import * as vscode from "vscode";

import { downloadAndExtract } from "./getAddon";
import { getExtensionContext } from "../config/globals";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function openWorkspace(manifestPath: string) {
  const rootUri = vscode.Uri.file(await getRootFolderPath());
  const manifestUri = vscode.Uri.file(manifestPath);

  // if the workspace is already open, just open the manifest
  const existingWorkspaceFolder = vscode.workspace.workspaceFolders?.find(
    (folder) => folder.uri.fsPath === rootUri.fsPath
  );
  if (existingWorkspaceFolder) {
    console.log("workspace already open");
    await vscode.commands.executeCommand(
      "workbench.files.action.collapseExplorerFolders"
    );
    await vscode.window.showTextDocument(manifestUri);
    return;
  }

  // otherwise, open the workspace and store the manifest URI to be opened when the workspace is ready
  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: rootUri,
    name: "Assay",
  });
  const context = getExtensionContext();
  context.globalState.update("manifestPath", manifestPath);
}

// handles urls of the form /review/<guid>/<version>
export async function handleReviewUrl(guid: string, version: string) {
  const rootPath = await getRootFolderPath();
  const addonManifestPath = `${rootPath}/addons/${guid}/${version}/manifest.json`;
  try {
    await fs.promises.stat(addonManifestPath);
  } catch (error) {
    await downloadAndExtract(guid, version);
  }

  await openWorkspace(addonManifestPath);
}

// handles vscode://mozilla.assay/... urls
export async function handleUri(uri: vscode.Uri) {
  const { path } = uri;
  const [_, action, ...rest] = path.split("/");

  if (action === "review") {
    const [guid, version] = rest;
    await handleReviewUrl(guid, version);
  }
}
