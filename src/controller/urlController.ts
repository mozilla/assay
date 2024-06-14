import * as fs from "fs";
import * as vscode from "vscode";

import { AddonController } from "./addonController";
import { RootController } from "./rootController";
import { stringToRange } from "../utils/helper";

export class UrlController{

  constructor(private context: vscode.ExtensionContext,
              private addonController: AddonController,
              private rootController: RootController){}

  async revealFile(uri: vscode.Uri, lineNumber?: string) {
    const editor = await vscode.window.showTextDocument(uri);
    if (lineNumber) {
      // highlight offending lines
      const lineRange = await stringToRange(lineNumber, uri);
      const selection = new vscode.Selection(lineRange.start, lineRange.end);
      editor.selections = [selection];
      // move editor to focus on line(s)
      editor.revealRange(lineRange, vscode.TextEditorRevealType.InCenter);
    }
  }

  // handles assay.get input
  async getAddonByUrl() {
    const result = await this.addonController.downloadAndExtract();
    if (!result) {
      return;
    }
    const { workspaceFolder, guid, version } = result;
    const versionPath = `${workspaceFolder}/${guid}/${version}`;
    await this.openWorkspace(versionPath);
  }

  // handles vscode://mozilla.assay/... urls
  async handleUri(uri: vscode.Uri) {
    const { path, query, fragment } = uri;
    const filepath = new URLSearchParams(query).get("path");
    const lineNumber = filepath ? `#${fragment}` : undefined;

    const [_, action, ...rest] = path.split("/");
    if (action === "review") {
      const [guid, version] = rest;
      await this.handleReviewUrl(guid, version, filepath || undefined, lineNumber);
    }
  }


  // handles urls of the form /review/<guid>/<version>?path=<file>
  private async handleReviewUrl(
    guid: string,
    version: string,
    filepath?: string,
    lineNumber?: string
  ) {
    const rootPath = await this.rootController.getRootFolderPath();
    const versionPath = `${rootPath}/${guid}/${version}`;
    try {
      await fs.promises.stat(versionPath);
    } catch (error) {
      await this.addonController.downloadAndExtract(guid, version);
    }
    await this.openWorkspace(versionPath, filepath, lineNumber);
  }

  private async openWorkspace(
    versionPath: string,
    filepath?: string,
    lineNumber?: string
  ) {
    const versionUri = vscode.Uri.file(versionPath);
    const filePath = `${versionPath}/${filepath ?? "manifest.json"}`;
    const workspace = vscode.workspace.workspaceFolders;

    // If user already has the version folder opened, open the manifest.json
    if (workspace && workspace[0].uri.fsPath === versionUri.fsPath) {
      this.revealFile(vscode.Uri.file(filePath), lineNumber);
    }
    // Otherwise, store the filePath (since the extension must restart) to open on launch.
    else {
      await this.context.globalState.update("filePath", filePath);
      if (lineNumber) {
        await this.context.globalState.update("lineNumber", lineNumber);
      }
      vscode.commands.executeCommand("vscode.openFolder", versionUri, true);
    }
  }

}