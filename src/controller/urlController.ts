import * as fs from "fs";
import * as vscode from "vscode";

import { AddonController } from "./addonController";
import { DirectoryController } from "./directoryController";
import { RangeHelper } from "../helper/rangeHelper";

export class UrlController implements vscode.UriHandler {
  constructor(
    private context: vscode.ExtensionContext,
    private addonController: AddonController,
    private directoryController: DirectoryController
  ) {}

  /**
   * Given a file and line(s), focuses VS Code onto the file and line(s).
   * @param uri The URI of the file.
   * @param lineNumber The line(s) to focus on, as its string representation.
   */
  async revealFile(uri: vscode.Uri, lineNumber: string | undefined) {
    const editor = await vscode.window.showTextDocument(uri);

    if (editor && lineNumber) {
      const { endLine } = RangeHelper.splitString(lineNumber);
      const buffer = await this.directoryController.readFile(uri);
      const content = buffer?.toString()?.split("\n");
      const endCharacter = content?.at(endLine)?.length;

      // highlight offending lines
      const lineRange = await RangeHelper.fromString(
        lineNumber,
        endCharacter ?? 0
      );
      const selection = new vscode.Selection(lineRange.start, lineRange.end);
      editor.selections = [selection];
      // move editor to focus on line(s)
      editor.revealRange(lineRange, vscode.TextEditorRevealType.InCenter);
    }
  }

  /**
   * Handles getting an addon by its URL.
   */
  async getAddonByUrl() {
    const result = await this.addonController.downloadAndExtract();
    if (!result) {
      return;
    }
    const { workspaceFolder, guid, version } = result;
    const versionPath = `${workspaceFolder}/${guid}/${version}`;
    await this.openWorkspace(versionPath);
  }

  /**
   * Handles vscode://mozilla.assay/... urls
   * @param uri The vscode:// link.
   */
  async handleUri(uri: vscode.Uri) {
    const { path, query, fragment } = uri;
    const filepath = new URLSearchParams(query).get("path");
    const lineNumber = filepath ? `#${fragment}` : undefined;

    const [_, action, ...rest] = path.split("/");
    if (action === "review") {
      const [guid, version] = rest;
      await this.handleReviewUrl(
        guid,
        version,
        filepath || undefined,
        lineNumber
      );
    }
  }

  /**
   * Opens the file at globalState's filePath if any was stored.
   * This occurs when a new window of VS Code is opened, and thus a new instance of the extension.
   */
  async openCachedFile() {
    if (this.context.globalState.get("filePath") !== undefined) {
      const filePath = this.context.globalState.get("filePath")?.toString();
      const lineNumber = this.context.globalState.get("lineNumber")?.toString();
      await this.context.globalState.update("filePath", undefined);
      await this.context.globalState.update("lineNumber", undefined);
      if (filePath) {
        this.revealFile(vscode.Uri.file(filePath), lineNumber);
      }
    }
  }

  /**
   * Handles urls of the form /review/<guid>/<version>?path=<file>
   * @param guid
   * @param version
   * @param filepath
   * @param lineNumber
   */
  private async handleReviewUrl(
    guid: string,
    version: string,
    filepath?: string,
    lineNumber?: string
  ) {
    const rootPath = await this.directoryController.getRootFolderPath();
    const versionPath = `${rootPath}/${guid}/${version}`;
    try {
      await fs.promises.stat(versionPath);
    } catch (error) {
      await this.addonController.downloadAndExtract(guid, version);
    }
    await this.openWorkspace(versionPath, filepath, lineNumber);
  }

  /**
   * Opens a workspace to the given version.
   * @param versionPath
   * @param filepath
   * @param lineNumber
   */
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
