import * as vscode from "vscode";

import { CommentCacheController } from "./commentCacheController";
import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";
import { splitUri } from "../utils/helper";

export class SidebarController{
  fileDecorator: CustomFileDecorationProvider;
  constructor(private commentCacheController: CommentCacheController){
    this.fileDecorator = new CustomFileDecorationProvider(this.fileHasComment);
  }

  async loadFileDecorator(uri?: vscode.Uri) {
    if (uri) {
      this.fileDecorator.updateDecorations(uri);
    } else {
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
  }
  
  async fileHasComment(uri: vscode.Uri) {
    const { guid, version, filepath } = await splitUri(uri);
    const comments = await this.commentCacheController.getComments();
    if (comments?.[guid]?.[version]?.[filepath]) {
      return true;
    }
    return false;
  }

}

