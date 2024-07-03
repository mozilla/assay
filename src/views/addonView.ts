import * as vscode from "vscode";

import { QPOption, TypeOption } from "../types";

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
   * Prompts the user whether to download the source code or the xpi.
   */
  static async promptType() {
    const choice = await vscode.window.showQuickPick(
      [QPOption.Xpi, QPOption.Source],
      {
        placeHolder:
          "A source code package is available. Select type to download:",
      }
    );

    switch (choice) {
      case QPOption.Xpi:
        return TypeOption.Xpi;
      case QPOption.Source:
        return TypeOption.Source;
      default:
        throw new Error("No input provided.");
    }
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
