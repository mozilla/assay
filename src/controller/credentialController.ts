

import * as jwt from "jsonwebtoken";
import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../config/config";
import { getExtensionSecretStorage } from "../config/globals";
import { getApiKeyInputFromUser, getSecretInputFromUser } from "../views/apiKeyView";
import { showErrorMessage } from "../views/notificationView";

/**
 * Retrieves the API key and secret from storage.
 * @returns the API key and secret.
 */
export async function getCredsFromStorage(): Promise<{
  apiKey: string;
  secret: string;
}> {
  const secrets = getExtensionSecretStorage();

  const [apiKey, secret] = await Promise.all([
    secrets.get("amoApiKey"),
    secrets.get("amoApiSecret"),
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

/**
 * Gets the API key from the user.
 * @returns whether the API key is successfully stored.
 */
export async function getApiKeyFromUser() {
  const secrets = getExtensionSecretStorage();
  const placeHolder = await secrets.get("amoApiKey");
  try{
    const apiKey = await getApiKeyInputFromUser(placeHolder);
    await secrets.store("amoApiKey", apiKey);
    return true;
  }
  catch{
    return false;
  }
}

/**
 * Gets the secret from the user.
 * @returns whether the secret is successfully stored.
 */
export async function getSecretFromUser() {
    const secrets = getExtensionSecretStorage();
    const placeHolder = truncateSecret((await secrets.get("amoApiSecret")) || "");
    try{
      const apiSecret = await getSecretInputFromUser(placeHolder);
      await secrets.store("amoApiSecret", apiSecret);
      return true;
    }
    catch {
      return false;
    }
}

/**
 * Tests the stored credentials against the API.
 * @returns whether the credentials are validated or not.
 */
export async function testApiCredentials() {
  const url = `${constants.apiBaseURL}accounts/profile/`;
  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });

  if (response.status === 200) {
    vscode.window.showInformationMessage(
      "Success! Assay API Key and Secret validated."
    );
    return true;
  } else {
    vscode.window.showErrorMessage(
      `Credential test failed: ${response.status} (${response.statusText})`,
      { title: "Close", isCloseAffordance: true }
    );
    return false;
  }
}

/**
 * Generates a shorter version of the secret that we can show to the user
 * @param str The secret.
 * @param size The number of characters to remove from the centre of the secret.
 * @returns The truncated secret.
 */
function truncateSecret(str: string, size = 4) {
  const head = str.substring(0, size);
  const tail = str.substring(str.length - size);
  return `${head}...${tail}`;
}

// as per https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
export async function makeToken() {
  const { apiKey, secret } = await getCredsFromStorage();

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 60,
  };

  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

export async function makeAuthHeader() {
  const token = await makeToken();
  return { Authorization: `JWT ${token}` };
}
