import * as vscode from "vscode";

import { QPOption } from "../types";

export class AddonView {
  /**
   * Retrieve the user's desired add-on to download.
   * @param input The user input representing the add-on.
   * @param urlVersion add-on version, if any.
   * @returns
   */
  static async promptVersionChoice(versionItems: string[]) {
    return await vscode.window.showQuickPick(versionItems, {
      placeHolder: "Choose a version:",
    });
  }

  /**
   * Prompts the user to input an add-on slug.
   * @returns the user input.
   */
  static async getInput(): Promise<string> {
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
  static async promptOverwrite() {
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
}
