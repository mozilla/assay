import * as path from "path";
import * as vscode from "vscode";

import { ReviewCacheController } from "./reviewCacheController";
import { RootController } from "./rootController";
import { ReviewStatusBarItem } from "../model/reviewStatusBarItem";

/**
 * Handles the logic for status bar related behaviour.
 * For UI interface naming conventions, see
 * https://code.visualstudio.com/docs/getstarted/userinterface
 */
export class StatusBarController {
  private reviewItem: ReviewStatusBarItem;
  constructor(private reviewCacheController: ReviewCacheController,
              private rootController: RootController){
    this.reviewItem = new ReviewStatusBarItem();
  }

  async updateStatusBar() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
  
    const doc = activeEditor.document;
    const filePath = doc.uri.fsPath;
    const rootFolder = await this.rootController.getRootFolderPath();
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
  
    const reviewUrl = await this.reviewCacheController.getReview([guid, "reviewUrl"]);
    this.reviewItem.updateAndShow(guid, reviewUrl);
    return true;
  }

}


