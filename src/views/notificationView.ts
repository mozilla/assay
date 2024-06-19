import * as vscode from "vscode";

import { ErrorMessages } from "../types";


export class NotificationView {
  /**
   * Shows progress in the editor. Progress is shown while running the given task.
   * @param message The message to display with the prompt.
   * @param task The async task to perform.
   * @returns the result of the task.
   */
  static async promptProgress(
    message: string,
    task: () => Promise<void>
  ) {
    return await vscode.window.withProgress(
      { title: "Assay", location: vscode.ProgressLocation.Notification },
      async (progress) => {
        progress.report({
          message: message,
        });
        await task();
      }
    );
  }

  /**
   * Displays an error message to the user, and the option to retry (if applicable).
   * @param errorMessages
   * @param status
   * @param tryAgainFunction
   * @param tryAgainFunctionParams
   * @returns
   */
  static async showErrorMessage(
    errorMessages: ErrorMessages,
    status: keyof ErrorMessages["window"] | keyof ErrorMessages["thrown"],
    tryAgainFunction?: (...args: any[]) => Promise<any>,
    tryAgainFunctionParams: any[] = []
  ) {
    const tryAgainButton = { title: "Try Again" };
    const fetchNewAddonButton = { title: "Fetch New Addon" };

    const message = errorMessages.window[status] || errorMessages.window.other;
    const cancelMessage =
      errorMessages.thrown[status] || errorMessages.thrown.other;

    return await vscode.window
      .showErrorMessage(
        message,
        { modal: true },
        tryAgainButton,
        fetchNewAddonButton
      )
      .then((action) => {
        if (action?.title === tryAgainButton.title) {
          return tryAgainFunction
            ? tryAgainFunction(...tryAgainFunctionParams)
            : Promise.resolve();
        } else if (action?.title === fetchNewAddonButton.title) {
          // restart the process, but also throw an error to end the current process
          vscode.commands.executeCommand("assay.get");
          throw new Error("Process restarted");
        } else {
          throw new Error(cancelMessage);
        }
      });
  }
}