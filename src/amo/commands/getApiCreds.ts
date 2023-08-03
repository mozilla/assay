import * as keytar from "keytar";
import * as vscode from "vscode";

import { showErrorMessage } from "../utils/processErrors";

export async function getApiKeyFromUser() {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Key (IE: user:12345678:123)",
    title: "AMO API Key",
  });

  if (!apiKey) {
    throw new Error("No API Key provided");
  }

  await keytar.setPassword("assay", "amoApiKey", apiKey);
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

  await keytar.setPassword("assay", "amoApiSecret", apiSecret);
  return true;
}

export async function getCredsFromStorage(): Promise<{
  apiKey: string;
  secret: string;
}> {
  const apiKey = await keytar.getPassword("assay", "amoApiKey");
  const secret = await keytar.getPassword("assay", "amoApiSecret");

  if (!apiKey || !secret) {
    await showErrorMessage(
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
    return { apiKey: "", secret: "" };
  }

  return { apiKey, secret };
}
