import * as linter from 'addons-linter';
import { existsSync } from 'node:fs';
import * as vscode from "vscode";

export async function lintAddonLocally() {
  const fsInput = await vscode.window.showInputBox({
    prompt: "Enter path to Addon (local file system)",
    title: "Lint AMO Addon Locally",
    ignoreFocusOut: true,
  });

  if (!fsInput) {
    throw new Error("lintAddon failed, no input provided!");
  }

  if (!existsSync(fsInput)) {
    throw new Error("lintAddon failed, the file path doesn't exist in local file system!");
  }

  const linterOptions: linter.Options = {
    config: {
        _: [fsInput],
        logLevel: process.env.VERBOSE ? 'debug' : 'fatal',
        stack: Boolean(process.env.VERBOSE),
        pretty: true,
        warningsAsErrors: false,
        metadata: false,
        output: 'none',
        boring: false,
        selfHosted: false,
    },
    runAsBinary: false,
  }

  try {
    const instance = linter.createInstance(linterOptions); 
    const lintResults = instance.run(); // TODO: This fails...
    console.log(lintResults);
  } catch (err) {
    console.error("addons-linter failed!\n", err);
  }
}

export async function lintAddonApi() {
  const fsInput = await vscode.window.showInputBox({ // TODO: What input could uniquely identify the extension?
    prompt: "Enter path the GUID of addon",
    title: "Lint AMO Addon Via Addons API",
    ignoreFocusOut: true,
  });

  if (!fsInput) {
    throw new Error("lintAddon failed, no input provided!");
  }

  if (!existsSync(fsInput)) {
    throw new Error("lintAddon failed, the file path doesn't exist in local file system!");
  }

  try {
    const lintResults = "Temporary value"; // = await // TODO: Make API call.
    console.log(lintResults);
  } catch (err) {
    console.error("addons-linter failed!\n", err);
  }
}
