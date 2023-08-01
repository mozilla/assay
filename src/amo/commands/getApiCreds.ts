import * as keytar from "keytar";
import * as vscode from "vscode";

export async function getApiKeyFromUser() {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Key (IE: user:12345678:123)",
    title: "AMO API Key",
  });

  if (!apiKey) {
    throw new Error("No API Key provided");
  }

  await keytar.setPassword("assay", "amoApiKey", apiKey);
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
}

export async function getCredsFromStorage(): Promise<{
  apiKey: string;
  secret: string;
}> {
  const apiKey = await keytar.getPassword("assay", "amoApiKey");
  const secret = await keytar.getPassword("assay", "amoApiSecret");

  if (!apiKey) {
    await getApiKeyFromUser();
    return await getCredsFromStorage();
  } else if (!secret) {
    await getSecretFromUser();
    return await getCredsFromStorage();
  }

  return { apiKey, secret };
}
