import * as vscode from "vscode";

import { getExtensionSecretStorage } from "../../config/globals";
import { showErrorMessage } from "../utils/processErrors";

export async function getApiKeyFromUser() {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Key (IE: user:12345678:123)",
    title: "AMO API Key",
  });

  if (!apiKey) {
    throw new Error("No API Key provided");
  }

  const secrets = getExtensionSecretStorage();

  await secrets.store("amoApiKey", apiKey);
  return true;
}

export async function getSecretFromUser() {
  const apiSecret = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Secret",
    title: "AMO API Secret",
    password: true,
  });

  if (!apiSecret) {
    throw new Error("No API Secret provided");
  }

  const secrets = getExtensionSecretStorage();
  await secrets.store("amoApiSecret", apiSecret);
  return true;
}

export async function getCredsFromStorage(): Promise<{
  apiKey: string;
  secret: string;
}> {
  const secrets = getExtensionSecretStorage();
  const apiKey = await secrets.get("amoApiKey");
  const secret = await secrets.get("amoApiSecret");

  if (!apiKey || !secret) {
    return await showErrorMessage(
      {
        window: {
          other: "No API Key or Secret found",
        },
        thrown: {
          other: "No API Key or Secret found",
        },
      },
      "other",
      getCredsFromStorage
    );
  }

  return { apiKey, secret };
}
