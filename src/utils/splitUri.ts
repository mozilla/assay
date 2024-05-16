import { Uri } from "vscode";

import { getRootFolderPath } from "./reviewRootDir";

export async function splitUri(uri: Uri) {
  const fullPath = uri.fsPath;
  const rootFolder = await getRootFolderPath();
  const relativePath = fullPath.replace(rootFolder, "");
  const guid = relativePath.split("/")[1];
  const version = relativePath.split("/")[2];
  const filepath = relativePath.split(version)[1];
  return { rootFolder, fullPath, relativePath, guid, version, filepath };
}
