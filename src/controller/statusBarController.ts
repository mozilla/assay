import * as path from "path";
import * as vscode from "vscode";

import { AddonCacheController } from "./addonCacheController";
import { DirectoryController } from "./directoryController";
import { ReviewStatusBarItem } from "../model/reviewStatusBarItem";

export class StatusBarController {

  private reviewItem: ReviewStatusBarItem;

  constructor(private addonCacheController: AddonCacheController,
              private directoryController: DirectoryController){
    this.reviewItem = new ReviewStatusBarItem();
  }

  /**
   * Updates the status bar.
   * @returns whether the status bar was updated.
   */
  async updateStatusBar() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return false;
    }
  
    const doc = activeEditor.document;
    const filePath = doc.uri.fsPath;
    const rootFolder = await this.directoryController.getRootFolderPath();
    if (!filePath.startsWith(rootFolder)) {
      this.reviewItem.hide();
      throw new Error("File is not in the root folder.");
    }
  
    const relativePath = filePath.replace(rootFolder, "");
    const guid = relativePath.split(path.sep)[1];
  
    if (!guid) {
      this.reviewItem.hide();
      throw new Error("No guid found.");
    }
  
    const reviewUrl = await this.addonCacheController.getAddonFromCache([guid, "reviewUrl"]);
    this.reviewItem.updateAndShow(guid, reviewUrl);
    return true;
  }

}


