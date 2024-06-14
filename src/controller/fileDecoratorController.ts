import * as vscode from "vscode";

import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";
import { splitUri } from "../utils/helper";

export class FileDecoratorController{
  constructor(private fileDecorator: CustomFileDecorationProvider){}

  async loadFileDecorator(){
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const doc = editor.document;
    const { fullPath, rootFolder } = await splitUri(doc.uri);

    if (!fullPath.startsWith(rootFolder)) {
      return;
    }
    this.fileDecorator.updateDecorations(doc.uri);
  }

  async loadFileDecoratorByUri(uri: vscode.Uri) {
      this.fileDecorator.updateDecorations(uri);
  }
}