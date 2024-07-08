import * as vscode from "vscode";

import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";

export class FileDecoratorController {
  constructor(private fileDecorator: CustomFileDecorationProvider) {}

  /**
   * Signals to update the file decorator of uri.
   * @param uri The uri to update.
   */
  async loadFileDecoratorByUri(uri: vscode.Uri) {
    this.fileDecorator.updateDecorations(uri);
  }
}
