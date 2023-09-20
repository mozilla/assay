import { SecretStorage } from "vscode";

let secrets: SecretStorage;
let storagePath: string;

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
