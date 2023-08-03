import * as vscode from "vscode";

import { errorMessages } from "../types";

export async function showErrorMessage(
  errorMessages: errorMessages,
  status: keyof errorMessages["window"] | keyof errorMessages["thrown"],
  tryAgainFunction: (...args: any[]) => Promise<any>,
  tryAgainFunctionParams?: any[]
) {
  const tryAgainButton = { title: "Try Again" };
  const fetchNewAddonButton = { title: "Fetch New Addon" };

  const message = errorMessages.window[status] || errorMessages.window.other;
  const cancelMessage =
    errorMessages.thrown[status] || errorMessages.thrown.other;

  await vscode.window
    .showErrorMessage(
      message,
      { modal: true },
      tryAgainButton,
      fetchNewAddonButton
    )
    .then((action) => {
      if (action?.title === tryAgainButton.title) {
        if (!tryAgainFunctionParams) {
          return tryAgainFunction();
        }
        return tryAgainFunction(...tryAgainFunctionParams);
      } else if (action?.title === fetchNewAddonButton.title) {
        // restart the process, but also throw an error to end the current process
        vscode.commands.executeCommand("assay.get");
        throw new Error("Process restarted");
      } else {
        throw new Error(cancelMessage);
      }
    });
}
