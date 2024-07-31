import * as path from "path";
import * as vscode from "vscode";

import { AddonCacheController } from "./addonCacheController";
import { CredentialController } from "./credentialController";
import { DirectoryController } from "./directoryController";
import constants from "../config/config";
import { Message, MessageType, ErrorMessages } from "../types";
import { LintView } from "../views/lintView";
import { NotificationView } from "../views/notificationView";

export class LintController {
  private dirtyFiles: Set<string>;

  constructor(
    private diagnosticCollection: vscode.DiagnosticCollection,
    private credentialController: CredentialController,
    private addonCacheController: AddonCacheController,
    private directoryController: DirectoryController
  ) {
    this.dirtyFiles = new Set();
  }

  /**
   * Tracks currently dirtied files.
   * @param event A vscode event describing a document change.
   */
  addDirty(event: vscode.TextDocumentChangeEvent) {
    const document = event.document;
    if (document.isDirty) {
      this.dirtyFiles.add(document.uri.fsPath);
    } else if (event.reason && event.contentChanges) {
      this.dirtyFiles.delete(document.uri.fsPath);
    }
  }

  /**
   * Remove a dirtied file.
   */
  removeDirty(document: vscode.TextDocument) {
    this.dirtyFiles.delete(document.uri.fsPath);
  }

  /**
   * Clears existing lints if a document is saved when it was dirtied.
   */
  clearLintsOnDirty(document: vscode.TextDocument) {
    console.log(this.dirtyFiles);
    if (this.dirtyFiles.has(document.uri.fsPath)) {
      this.clearLints(document.uri);
    }
    this.removeDirty(document);
  }

  /**
   * If a file is deleted from a version, remove the version's lints.
   * @param event A VS Code FileDeleteEvent
   */
  // Since lints only happen if the workspace is open directly to the version folder,
  // the diagnosticCollection can be cleared without fear of edge cases.
  clearLintsOnDelete(event: vscode.FileDeleteEvent) {
    let warnUser = true;
    for (const file of event.files) {
      this.clearLints(vscode.Uri.parse(file.fsPath, warnUser));
      warnUser = false;
    }
  }

  /**
   * Removes existing lints and sets the version as dirtied.
   * @param uri
   * @param warnUser whether to prompt the user that removal occurred
   */
  private clearLints(uri: vscode.Uri, warnUser = true) {
    this.directoryController.splitUri(uri).then((result) => {
      const { guid, version } = result;
      if (guid && version) {
        this.addonCacheController.setVersionAsDirty(guid, version);
        this.diagnosticCollection.clear();
        if (warnUser) {
          LintView.warnOnSave();
        }
      }
    });
  }

  /**
   * Lints the current workspace.
   */
  async lintWorkspace() {
    const workspace = vscode.workspace.workspaceFolders?.at(0);
    if (!workspace) {
      return;
    }

    const { versionPath, guid, version } =
      await this.directoryController.splitUri(workspace.uri);

    if (!versionPath) {
      return;
    }

    if (await this.addonCacheController.isDirty(guid, version)) {
      return;
    }

    const { success, messages } = (await this.fetchLints(guid, version)) || [
      undefined,
      undefined,
    ];
    if (!success) {
      return;
    }

    const populateDiagnostic = async (messages: Message[]) => {
      for (const message of messages) {
        const diagnostic = await this.formatNotice(versionPath, message);
        if (diagnosticMap.has(message.file)) {
          diagnosticMap.get(message.file)?.push(diagnostic);
        } else {
          diagnosticMap.set(message.file, [diagnostic]);
        }
      }
    };

    const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
    await populateDiagnostic(messages);

    diagnosticMap.forEach((diagnostics, file) => {
      const uri = this.getUriFromVersionPath(versionPath, file);
      this.diagnosticCollection.set(uri, diagnostics);
    });
  }

  /**
   * Fetches the lints for an add-on.
   * @param guid The add-on to fetch lints for.
   * @returns The lint information.
   */
  private async fetchLints(guid: string, version: string) {
    const { id: addonID, fileIDs: fileIDs } =
      await this.addonCacheController.getAddonFromCache([guid]);

    const fileID = fileIDs[version];
    if (!fileID || !addonID) {
      return;
    }

    const url = `${constants.apiBaseURL}reviewers/addon/${addonID}/file/${fileID}/validation/`;

    const headers = await this.credentialController.makeAuthHeader();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorMessages: ErrorMessages = {
        window: {
          404: `(Status ${response.status}): Failed to lint. Validation not found.`,
          401: `(Status ${response.status}): Failed to lint. Unauthorized request.`,
          403: `(Status ${response.status}): Failed to lint. Inadequate permissions`,
          other: `(Status ${response.status}): Could not fetch lint.`,
        },
        thrown: {
          404: "Failed to lint. Validation not found.",
          401: "Failed to lint. Unauthorized request.",
          403: "Failed to lint. Inadequate permissions",
          other: "Could not fetch lint.",
        },
      };

      await NotificationView.showErrorMessage(
        errorMessages,
        response.status,
        this.fetchLints,
        [guid]
      );

      return;
    }

    const json = await response.json();

    return json.validation;
  }

  /**
   * Formats a lint into a Diagnostic.
   * @param versionPath The path to the version folder.
   * @param notice The notice to format.
   * @returns Diagnostic
   */
  private async formatNotice(versionPath: string, notice: Message) {
    const typeToSeverity = (type: MessageType) => {
      switch (type) {
        case "error":
          return vscode.DiagnosticSeverity.Error;
        case "notice":
          return vscode.DiagnosticSeverity.Information;
        case "warning":
          return vscode.DiagnosticSeverity.Warning;
      }
    };

    const fileUri = this.getUriFromVersionPath(versionPath, notice.file);
    const buffer = await this.directoryController.readFile(fileUri);
    const fileText = buffer?.toString()?.split("\n");
    const lineNumber = notice.line ? notice.line - 1 : 0;
    const lineText = fileText?.at(lineNumber);

    const startChar = notice.line ? lineText?.match(/\S/)?.index : 0;
    const endChar = notice.line ? lineText?.length : 0;
    const startPosition = new vscode.Position(lineNumber, startChar ?? 0);
    const endPosition = new vscode.Position(lineNumber, endChar ?? 0);
    const range = new vscode.Range(startPosition, endPosition);

    const diagnostic: vscode.Diagnostic = {
      range,
      severity: typeToSeverity(notice.type),
      message: notice.message,
      source: "Assay",
      code: notice.code,
    };

    return diagnostic;
  }

  /**
   * Returns a lint's filepath's location on disk.
   * @param versionPath The path to the version folder.
   * @param filepath The filepath within the version.
   * @returns the URI location.
   */
  private getUriFromVersionPath(versionPath: string, filepath: string) {
    return vscode.Uri.file(path.join(versionPath, filepath));
  }
}
