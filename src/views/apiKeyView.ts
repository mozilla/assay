import * as vscode from "vscode";


export async function getApiKeyInputFromUser(placeHolder: string | undefined) {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Key (e.g. user:12345678:123)",
    title: "AMO API Key",
    placeHolder,
    ignoreFocusOut: true,
  });
  if (!apiKey) {
    throw new Error("No API Key provided");
  }
  return apiKey;
}


export async function getSecretInputFromUser(placeHolder: string | undefined) {
  const apiSecret = await vscode.window.showInputBox({
    prompt: "Enter your AMO API Secret",
    title: "AMO API Secret",
    placeHolder,
    password: true,
    ignoreFocusOut: true,
  });
  if (!apiSecret) {
    throw new Error("No API Secret provided.");
  }
  return apiSecret;
}
