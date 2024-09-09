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
    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            main {
              font-family: Arial, sans-serif;
              margin: 1em;
              max-width: 80%;
            }

            .img-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5em;
                margin: 1em 3em; 
            }

            img {
                width: 100%;
                max-width: 35em;
            }

            h1,
            h2,
            h3,
            h4 {
              text-align: center;
            }

            .subtitle {
              opacity: 50%;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <main>
            <h1>Welcome To Assay!</h1>

            <hr>

            <h2>Set-up</h2>

            <h3>1. API Keys</h3>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/commands.png" />
              <div class="subtitle">Assay's Primary Sidebar.</div>
            </div>
            You will need a JWT Issuer and a JWT Secret to use Assay. Both of these can be
            obtained from the
            <a href="https://addons.mozilla.org/en-US/developers/addon/api/key/">Mozilla Developer Hub</a>.<br><br>
            To add them to Assay for the first time --
            <ol>
              <li>Navigate to the Assay sidebar.</li>
              <li>Press <code>'Enter API Key'</code> and enter the API key.</li>
              <li>Press <code>'Enter Secret'</code> and enter the API's secret.</li>
            </ol>

            Once you've begun installing add-ons, this menu will no longer be visible.
            To update your keys, you can open the command palette (<code>Ctrl+Shift+P</code>)
            and enter <code>'Enter API Key'</code> or <code>'Enter Secret'</code>
            to open their respective menus.

            <br><br>

            <h3>2. Root Directory</h3>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/rootdir.png" />
              <div class="subtitle">This can be changed in the extension settings.</div>
            </div>
            Upon first interacting with Assay, you will be prompted to set the root folder path.
            Assay relies on having a dedicated directory for your reviews.
            Decide on an empty directory for where you will perform reviews.

            <br><br>

            <hr>
            <h2>Usage</h2>

            <h3>1. Downloading add-ons & Versions</h3>
            <h4>A. From VS Code</h4>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/newAddon.png" />
            </div>
            To download an add-on version directly within VSCode:
            <ol>
              <li>Navigate to the Assay sidebar.</li>
              <li>Press the '+' in the top-right corner of the menu.</li>
              <li>Input an add-on identifier such as its URL, GUID, etc.</li>
              <li>Select the version to download.</li>
            </ol>
            <h4>B. From Review Page</h4>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/reviewPage.png" />
            </div>
            To download an add-on version from AMO:
            <ol>
              <li>Navigate to the add-on's review page.</li>
              <li>Locate the 'Add-on History' section.</li>
              <li>Under the desired version, select <code>'Open in VSC'</code>, OR</li>
              <li>Click the file name of a flagged file.</li>
            </ol>
            This will launch VSCode, perform the download (if needed),
            and open the desired file (or manifest if there is none) in a text editor.

            <br><br>

            <h3>2. Linting Versions</h3>

            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/linter.png" />
            </div>

            When open to a specific version, Assay will highlight any lines flagged by addons-linter.
            To view a summary of the messages and to jump between them, navigate to the Problems pane of VS Code.

            <b>Note</b>: Any local changes you make to the add-on will clear the lints for that version!
            To fetch them again, install a fresh copy of the add-on version.

            <br><br>

            <h3>3. Reviewing Versions</h3>
            <h4>A. Reviewing Code</h4>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/commenting.gif" />
              <div class="subtitle">Directly copying line numbers.</div>
            </div>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/commenting2.gif" />
              <div class="subtitle">Marking lines in bulk and exporting. You can also export from the Assay sidebar.</div>
            </div>

            To mark or share offending lines:

            <ol>
              <li>Hover over or select multiple lines and right click to open the context menu.</li>
              <li>Here, you can:
                <ol type="a">
                  <li>Directly copy the file and line number, or</li>
                  <li>Store the line to export in bulk.</li>
                </ol>
              </li>
              <li>With the latter, you have more options in the top-right corner:
                <ol type="a">
                  <li>Export the comments to your clipboard,</li>
                  <li>Copy a link to the lines,</li>
                  <li>Delete the comment entirely.</li>
                </ol>
              </li>
            </ol>

            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/buttons.png" />
              <div class="subtitle">In order: Export, copy link, and delete.</div>
            </div>
            <h4>B. Exporting Comments</h4>
            To export the comments to a text format, you can:
            <ol>
              <li>
                Navigate to the Assay sidebar and right-click the desired version. Select
                <code>'Export Comments'</code>.
              </li>
              <li>
                Press the 'Export Version Comments' button in the top right corner of
                any expanded comment.
              </li>
            </ol>
            <h4>C. Opening Review Page</h4>
            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/reviewlink.png" />
            </div>
            If you are inside a file attributed to a certain review,
            to open the review page of an add-on:
            <ol>
              <li>Locate the status bar across the bottom of your window.</li>
              <li>Locate the button <code>'{guid} - Review Page</code>.</li>
              <li>Clicking it will bring you to the review page.</li>
            </ol>

            <h3>4. Diff Tool</h3>

            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/folderContext.png" />
            </div>

            To compare folders of add-on versions:
            <ol>
              <li>Navigate to the Assay sidebar.</li>
              <li>Select two versions (<code>Ctrl+Click</code>).</li>
              <li>Right click and select <code>Open Versions in Diff Tool.</code></li>
            </ol>

            If this is your first time diff-ing, Assay will prompt you for a diff command.
            Enter the command that would launch your preferred tool from the cli
            (ex. "bcomp" for Beyond Compare). This will open your desired diff tool with the
            two folders as arguments.

            <div class="img-wrapper">
              <img src="${mediaFolderSrc}/diff.png" />
              <div class="subtitle">This can be changed in the extension settings.</div>
            </div>

            <br><br>

            <h3>5. Updates</h3>
            To update the extension:
            <ol>
              <li>Open the command palette (<code>Ctrl+Shift+P</code>).</li>
              <li>Look for <code>'(Assay) Check for Updates'</code>.</li>
            </ol>
            This will automatically update the extension if there is a new version available.
          </main>
        </body>
      </html>
    `;
  }
}
