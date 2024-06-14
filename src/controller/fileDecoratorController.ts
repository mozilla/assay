import * as vscode from "vscode";

import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";

export class FileDecoratorController{
  constructor(private fileDecorator: CustomFileDecorationProvider){}
  
  async loadFileDecoratorByUri(uri: vscode.Uri) {
      this.fileDecorator.updateDecorations(uri);
  }
}