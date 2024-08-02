import * as path from "path";
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
   * @returns whether the status bar is updated and shown.
   */
  async updateStatusBar() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return false;
    }

    const doc = activeEditor.document;
    if (!(await this.directoryController.inRoot(doc.uri))) {
      this.reviewItem.hide();
      return false;
    }

    const { guid } = await this.directoryController.splitUri(doc.uri);

    if (!guid) {
      this.reviewItem.hide();
      return false;
    }

    const reviewUrl = await this.addonCacheController.getAddonFromCache([
      guid,
      "reviewUrl",
    ]);
    this.reviewItem.updateAndShow(guid, reviewUrl);
    return true;
  }
}
