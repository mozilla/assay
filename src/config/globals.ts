import { SecretStorage } from "vscode";

let secrets: SecretStorage;

export function setExtensionSecretStorage(secretStorage: SecretStorage) {
  secrets = secretStorage;
}

export function getExtensionSecretStorage(): SecretStorage {
  return secrets;
}
