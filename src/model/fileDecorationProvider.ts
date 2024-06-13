import * as vscode from "vscode";
import { Event } from "vscode";

export class CustomFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations: Event<vscode.Uri | vscode.Uri[]> = this._onDidChangeFileDecorations.event;
  
  constructor(private provideDecorationClause: (uri: vscode.Uri) => Promise<boolean>){}

  async provideFileDecoration(uri: vscode.Uri) {
    if(await this.provideDecorationClause(uri)){
      return {
        badge: "✎",
        color: new vscode.ThemeColor("charts.green"),
        propagate: true,
      };
    }
  }

  updateDecorations(uri: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }
}
