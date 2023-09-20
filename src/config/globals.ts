import * as path from "path";
import { SecretStorage } from "vscode";
import * as vscode from "vscode";

let secrets: SecretStorage;
let storagePath: string;

export const commentDecoration: vscode.TextEditorDecorationType =
  vscode.window.createTextEditorDecorationType({
    gutterIconPath: vscode.Uri.file(
      path.join(__dirname, "..", "media", "comment.svg")
    ),
    gutterIconSize: "contain",
  });

export function setExtensionSecretStorage(secretStorage: SecretStorage) {
  secrets = secretStorage;
}

export function getExtensionSecretStorage(): SecretStorage {
  return secrets;
}

export function setExtensionStoragePath(path: string) {
  storagePath = path;
}

export function getExtensionStoragePath() {
  return storagePath;
}