import path = require("path");
import * as vscode from "vscode";

export class WelcomeView {
  public static currentPanel: WelcomeView | undefined;
  public static readonly viewType = "welcomeView";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.ViewColumn.Beside;

    // show if exists
    if (WelcomeView.currentPanel) {
      WelcomeView.currentPanel._panel.reveal(column);
      return;
    }

    // create new
    const panel = vscode.window.createWebviewPanel(
      WelcomeView.viewType,
      "Assay",
      column,
      {
        enableScripts: true,
      }
    );

    WelcomeView.currentPanel = new WelcomeView(panel, extensionUri);
    WelcomeView.currentPanel._initializeWebview();
    WelcomeView.currentPanel._messageListener();
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._panel.onDidDispose(() => this.dispose());
  }

  private _messageListener() {
    this._panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "fetchAddon":
          vscode.commands.executeCommand("assay.get");
          return;
      }
    });
  }
  // get html from welcome.html
  private _getWebviewContent(): Promise<string> {
    return new Promise((resolve) => {
      const htmlPath = vscode.Uri.joinPath(
        this._extensionUri,
        "src/amo/views/templates",
        "welcome.html"
      );

      vscode.workspace.fs.readFile(htmlPath).then((fileContent) => {
        resolve(fileContent.toString());
      });
    });
  }

  // display html
  private async _initializeWebview() {
    const htmlContent = await this._getWebviewContent();
    this._panel.webview.html = htmlContent;
  }

  public dispose() {
    WelcomeView.currentPanel = undefined;
    this._panel.dispose();
  }
}
