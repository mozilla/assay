import * as vscode from "vscode";

export class ReviewStatusBarItem {
  public guid: string | undefined;
  public reviewUrl: string | undefined;

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  text = "Assay";

  public hide(){
    this.statusBarItem.hide();
  }

  public updateAndShow(guid: string, reviewUrl: string){

    this.statusBarItem.text = `${guid} - Review Page`;
    this.statusBarItem.tooltip = reviewUrl;
    this.statusBarItem.command = {
      command: "assay.review",
      arguments: [reviewUrl],
      title: "Review",
    };

    this.statusBarItem.show();
  }
}