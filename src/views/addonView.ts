import * as vscode from "vscode";

import { QPOption } from "../types";

/**
 * Retrieve the user's desired add-on to download.
 * @param input The user input representing the add-on.
 * @param urlVersion add-on version, if any.
 * @returns
 */
export async function promptVersionChoice(
  versionItems: string[]
) {
  return await vscode.window.showQuickPick(versionItems, {
    placeHolder: "Choose a version:",
  });
}

/**
 * Prompts the user to input an add-on slug.
 * @returns the user input.
 */
export async function getInput(): Promise<string> {
  const input = await vscode.window.showInputBox({
    prompt: "Enter Addon Slug, GUID, AMO ID, or URL",
    title: "Assay",
    ignoreFocusOut: true,
  });
  if (!input) {
    throw new Error("No input provided.");
  }
  return input;
}

/**
 * Prompts the user whether to overwrite the existing add-on.
 */
export async function promptOverwrite() {
  const choice = await vscode.window.showQuickPick(
    [QPOption.Yes, QPOption.No],
    {
      placeHolder: "Addon already exists. Overwrite?",
    }
  );
  if (choice === QPOption.No || !choice) {
    throw new Error("Extraction cancelled");
  }
}
