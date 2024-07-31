import * as vscode from "vscode";

import { EnvOption } from "../types";

export class ConfigView {
  static async promptEnvironment() {
    const env = await vscode.window.showQuickPick(
      [EnvOption.Dev, EnvOption.Prod, EnvOption.Stage],
      {
        title: "Select Environment:",
      }
    );
    if (!env) {
      return undefined;
    }
    return env;
  }

  static async promptEnvChange(environment: string) {
    vscode.window.showInformationMessage(`(Assay) Switched to ${environment}.`);
  }
}
