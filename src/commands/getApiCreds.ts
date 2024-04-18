import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../config/config";
import { getExtensionSecretStorage } from "../config/globals";
import { showErrorMessage } from "../utils/processErrors";
import { makeAuthHeader } from "../utils/requestAuth";

export async function getApiKeyFromUser() {
  const secrets = getExtensionSecretStorage();

  const placeHolder = (await secrets.get("amoApiKey"));
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Key (e.g. user:12345678:123)",
    title: "AMO API Key",
    placeHolder,
    ignoreFocusOut: true,
  });

  if (apiKey === undefined) {
    // User cancelled input
    return false;
  } else if (!apiKey) {
    throw new Error("No API Key provided");
  }

  await secrets.store("amoApiKey", apiKey);
  return true;
}

// Generate a shorter version of the secret that we can show to the user
export function truncateSecret(str: string, size = 4) {
  const head = str.substring(0, size);
  const tail = str.substring(str.length - size);
  return `${head}...${tail}`;
}

export async function getSecretFromUser() {
  const secrets = getExtensionSecretStorage();
  const placeHolder = truncateSecret((await secrets.get("amoApiSecret")) || '');

  const apiSecret = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Secret",
    title: "AMO API Secret",
    placeHolder,
    password: true,
    ignoreFocusOut: true,
  });

  if (apiSecret === undefined) {
    // User cancelled input
    return false;
  } else if (!apiSecret) {
    throw new Error("No API Secret provided");
  }

  await secrets.store("amoApiSecret", apiSecret);

  return true;
}

export async function getCredsFromStorage(): Promise<{
  apiKey: string;
  secret: string;
}> {
  const secrets = getExtensionSecretStorage();

  const [apiKey, secret] = await Promise.all([
    secrets.get("amoApiKey"),
    secrets.get("amoApiSecret")
  ]);

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

export async function testApiCredentials() {
  const url = `${constants.apiBaseURL}accounts/profile/`;
  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });

  if (response.status === 200) {
    vscode.window.showInformationMessage("Success! Assay API Key and Secret validated.");
    return true;
  } else {
    vscode.window.showErrorMessage(
      `Credential test failed: ${response.status} (${response.statusText})`,
      { title: "Close", isCloseAffordance: true },
    );
    return false;
  }
}
