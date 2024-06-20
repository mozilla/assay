import * as jwt from "jsonwebtoken";
import fetch from "node-fetch";
import * as vscode from "vscode";

import constants from "../config/config";
import { CredentialView } from "../views/credentialView";
import { NotificationView } from "../views/notificationView";

export class CredentialController {
  constructor(private secrets: vscode.SecretStorage) {}

  /**
   * Retrieves the API key and secret from storage.
   * @returns the API key and secret.
   */
  async getCredsFromStorage(): Promise<{
    apiKey: string;
    secret: string;
  }> {
    const [apiKey, secret] = await Promise.all([
      this.secrets.get("amoApiKey"),
      this.secrets.get("amoApiSecret"),
    ]);

    if (!apiKey || !secret) {
      return await NotificationView.showErrorMessage(
        {
          window: {
            other: "No API Key or Secret found",
          },
          thrown: {
            other: "No API Key or Secret found",
          },
        },
        "other",
        this.getCredsFromStorage
      );
    }

    return { apiKey, secret };
  }

  /**
   * Gets the API key from the user.
   * @returns whether the API key is successfully stored.
   */
  async getApiKeyFromUser() {
    const placeHolder = await this.secrets.get("amoApiKey");
    try {
      const apiKey = await CredentialView.getApiKeyInputFromUser(placeHolder);
      await this.secrets.store("amoApiKey", apiKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the secret from the user.
   * @returns whether the secret is successfully stored.
   */
  async getSecretFromUser() {
    const placeHolder = this.truncateSecret(
      (await this.secrets.get("amoApiSecret")) || ""
    );
    try {
      const apiSecret = await CredentialView.getSecretInputFromUser(
        placeHolder
      );
      await this.secrets.store("amoApiSecret", apiSecret);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Tests the stored credentials against the API.
   * @returns whether the credentials are validated or not.
   */
  async testApiCredentials() {
    const url = `${constants.apiBaseURL}accounts/profile/`;
    const headers = await this.makeAuthHeader();
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
   * Generates a auth header with JWT authorization token.
   * @returns A fetch header.
   */
  async makeAuthHeader() {
    const token = await this.makeToken();
    return { Authorization: `JWT ${token}` };
  }

  /**
   * Creates a JWT token as per
   * https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
   * @returns JWT Token.
   */
  private async makeToken() {
    const { apiKey, secret } = await this.getCredsFromStorage();

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      jti: Math.random().toString(),
      iat: issuedAt,
      exp: issuedAt + 60,
    };

    return jwt.sign(payload, secret, { algorithm: "HS256" });
  }

  /**
   * Generates a shorter version of the secret that we can show to the user
   * @param str The secret.
   * @param size The number of characters to remove from the centre of the secret.
   * @returns The truncated secret.
   */
  private truncateSecret(str: string, size = 4) {
    const head = str.substring(0, size);
    const tail = str.substring(str.length - size);
    return `${head}...${tail}`;
  }
}
