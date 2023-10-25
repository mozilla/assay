import { SecretStorage } from "vscode";

import { CustomFileDecorationProvider } from "../views/fileDecorations";

let secrets: SecretStorage;
let storagePath: string;
let fileDecorator: CustomFileDecorationProvider;

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

export function setFileDecorator(decorator: CustomFileDecorationProvider) {
  fileDecorator = decorator;
}

export function getFileDecorator() {
  return fileDecorator;
}
