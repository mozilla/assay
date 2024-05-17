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
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    WelcomeView.currentPanel = new WelcomeView(panel, extensionUri);

    const mediaFolderPath = vscode.Uri.joinPath(extensionUri, "media");
    const mediaFolderSrc = panel.webview.asWebviewUri(mediaFolderPath);

    WelcomeView.currentPanel._initializeWebview(mediaFolderSrc);
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

  // display html
  private async _initializeWebview(mediaFolderSrc: vscode.Uri) {
    const htmlContent = this._getWebviewContent(mediaFolderSrc);
    this._panel.webview.html = htmlContent;
  }

  public dispose() {
    WelcomeView.currentPanel = undefined;
    this._panel.dispose();
  }

  private _getWebviewContent(mediaFolderSrc: vscode.Uri) {
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Welcome To Assay</h1>
        <p>A reviewer tool for Mozilla Firefox addons!</p>
        <h2>Instructions</h2>
        <h3>API Keys</h3>
        <img src="${mediaFolderSrc}/commands.png" width="200" />
        <br />
        You will need a JWT Issuer and a JWT Secret to use Assay. These can be
        obtained from the
        <a href="https://addons.mozilla.org/en-US/developers/addon/api/key/"
          >Mozilla Developer Hub</a
        >.<br /><br />
        To add them to Assay, under the "Assay" menu, click "Enter API Key" and
        "Enter API Secret" respectively.<br />
        <h3>Root Directory</h3>
        This extension relies on having a dedicated directory for your reviews. This
        is so the guid and versions of an addon are consistently at the same folder
        depth. So, decide on a location for where you will perform reviews. Upon
        your first request to download an addon, you will be prompted to set the
        root folder path.
        <br /><br />
        <img src="${mediaFolderSrc}/rootdir.png" width="300" />
        <br /><br />
        (This can be changed in the extension settings).
        <h3>Diff Tool</h3>
        <img src="${mediaFolderSrc}/folder context.png" width="300" />
        <br /><br />
        To compare folders of addon versions, simply select exactly two folders in
        the sidebar. Then, from the context menu, click the command "(Assay) Open in
        Diff Tool". If it's your first time, enter the command that would launch the
        tool from the cli (e.g: "opendiff"). This will open your desired diff tool
        with the two folders as arguments.<br /><br />
        <img src="${mediaFolderSrc}/diff.png" width="300" />
        <br /><br />
        This can be changed in the extension settings.
        <br /><br />
        There is also an extension on the VSCode marketplace called
        <a
          href="https://marketplace.visualstudio.com/items?itemName=moshfeu.compare-folders"
          >Compare Folders</a
        >
        which is a great tool to use within VSCode.
        <h3>Downloading Addons & Versions</h3>
        <h4>From an Input</h4>
        You can download an addon version directly within VSCode by accessing the
        command titled "Review New Addon Version" from the Assay menu. This will
        prompt you for an addon identifier as well as the versions.
        <br /><br />
        You will require the API keys mentioned above to use this feature.
        <h4>From Review Page</h4>
        <img src="${mediaFolderSrc}/reviewpage.gif" width="600" />
        <br /><br />
        On the review page, there is now a new button titled "Open in VSC" under
        each version. This will automatically launch VSCode, perform the download,
        and open the manifest in a text editor.
        <br /><br />
        You will require the API keys mentioned above to use this feature.
        <h3>Reviewing Versions</h3>
        <h4>Adding/Removing Comments</h4>
        <img src="${mediaFolderSrc}/commenting.gif" width="600" />
        <br /><br />
        To add a comment, either hover over a line or select multiple lines
        and press the 'plus' popup in the gutter. The comment will be saved to cache upon submission and a visual
        indicator in the gutter and file tree will be displayed. You can press the indicator
        to hide or show the comment as needed.
        <br /><br />
        To remove a comment, open the comment and press the 'Delete Comment' button
        in the top right corner, represented by an 'X' icon.
        <h4>Exporting Comments</h4>
        To export the comments to a text format, you can:
        <ul>
          <li>
            Open the context menu of any file/folder that is a subfolder of the
            specific version folder, or the version folder itself, then select
            "(Assay) Export Version Comments".
          </li>
          <br />
          <li>
            Navigate to and open a file that belongs to a version. Open the command
            palette and choose "(Assay) Export Version Comments". This will export all
            comments for the version the file belongs to.
          </li>
          <br />
          <li>
            Press the 'Export Version Comments' button in the top right corner of
            any expanded comment.
          </li>
        </ul>
        <h4>Opening Review Page</h4>
        <img src="${mediaFolderSrc}/reviewlink.png" width="200" />
        <br /><br />
        To open the review page of an addon, there is a taskbar button titled
        "{guid} - Review Page". Clicking that will bring you to the review page.
      <h3>Updates</h3>
        To update the extension, simply look for "(Assay) Check for Updates" in the command palette. 
        This will automatically update the extension if there is a new version available.
      </body>
    </html>
    `;
  }
}
