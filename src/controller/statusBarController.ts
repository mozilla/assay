import * as vscode from "vscode";

import { AddonCacheController } from "./addonCacheController";
import { DirectoryController } from "./directoryController";
import { ReviewStatusBarItem } from "../model/reviewStatusBarItem";

export class StatusBarController {
  private reviewItem: ReviewStatusBarItem;

  constructor(
    private addonCacheController: AddonCacheController,
    private directoryController: DirectoryController
  ) {
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
    if (!await this.directoryController.inRoot(doc.uri)) {
      this.reviewItem.hide();
      throw new Error("File is not in the root folder.");
    }
    const { guid } = await this.directoryController.splitUri(doc.uri);

    if (!guid) {
      this.reviewItem.hide();
      throw new Error("No guid found.");
    }

    const reviewUrl = await this.addonCacheController.getAddonFromCache([
      guid,
      "reviewUrl",
    ]);
    this.reviewItem.updateAndShow(guid, reviewUrl);
    return true;
  }
}
