import * as vscode from "vscode";

import { FileDirectoryController } from "./fileDirectoryController";
import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";

export class FileDecoratorController{
  constructor(private fileDecorator: CustomFileDecorationProvider, private fileDirectoryController: FileDirectoryController){}

  async loadFileDecorator(){
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const doc = editor.document;
    const { fullPath, rootFolder } = await this.fileDirectoryController.splitUri(doc.uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }
    this.fileDecorator.updateDecorations(doc.uri);
  }

  async loadFileDecoratorByUri(uri: vscode.Uri) {
      this.fileDecorator.updateDecorations(uri);
  }
}