import * as fs from "fs";
import * as vscode from "vscode";

import { downloadAndExtract } from "./getAddon";
import { getRootFolderPath } from "../utils/reviewRootDir";

// handles urls of the form /review/<guid>/<version>
export async function handleReviewUrl(guid: string, version: string) {
  const rootPath = await getRootFolderPath();
  const addonVersionManifestPath = `${rootPath}/${guid}/${version}/manifest.json`;
  try {
    await fs.promises.stat(addonVersionManifestPath);
  } catch (error) {
    await downloadAndExtract(guid, version);
  }

  const addonManifestUri = vscode.Uri.file(addonVersionManifestPath);
  await vscode.window.showTextDocument(addonManifestUri);
}

// handles vscode://mozilla.assay/... urls
export async function handleUri(uri: vscode.Uri) {
  const { path } = uri;
  const action = path.split("/")[1];

  if (action === "review") {
    const guid = path.split("/")[2];
    const version = path.split("/")[3];
    await handleReviewUrl(guid, version);
  }
}