import * as vscode from "vscode";
import { Event } from "vscode";

export class CustomFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations: Event<vscode.Uri | vscode.Uri[]> = this._onDidChangeFileDecorations.event;
  private provideDecorationClause: (uri: vscode.Uri) => Promise<boolean>;
  constructor(){
    this.provideDecorationClause = () => Promise.resolve(false);
  }

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

  setProvideDecorationClause(clause: (uri: vscode.Uri) => Promise<boolean>){
    this.provideDecorationClause = clause;
  }

}
