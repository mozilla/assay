import * as vscode from "vscode";

import constants from "../config/config";
import { getDiagnosticCollection } from "../config/globals";
import { Message, MessageType, errorMessages } from "../types";
import { getFromCache } from "../utils/addonCache";
import { readFile } from "../utils/getThreadLocation";
import { showErrorMessage } from "../utils/processErrors";
import { makeAuthHeader } from "../utils/requestAuth";
import { splitUri } from "../utils/splitUri";

function getUriFromVersionPath(versionPath: string, filepath: string) {
  return vscode.Uri.file(`${versionPath}/${filepath}`);
}

async function formatNotice(versionPath: string, n: Message) {
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

  const fileUri = getUriFromVersionPath(versionPath, n.file);
  const buffer = await readFile(fileUri);
  const fileText = buffer?.toString()?.split("\n");
  const lineNumber = n.line ? n.line - 1 : 0;
  const lineText = fileText?.at(lineNumber);

  const startChar = n.line ? lineText?.match(/\S/)?.index : 0;
  const endChar = n.line ? lineText?.length : 0;
  const startPosition = new vscode.Position(lineNumber, startChar ?? 0);
  const endPosition = new vscode.Position(lineNumber, endChar ?? 0);
  const range = new vscode.Range(startPosition, endPosition);

  const diagnostic: vscode.Diagnostic = {
    range,
    severity: typeToSeverity(n.type),
    message: n.message,
    source: "Assay",
    code: n.code,
  };

  return diagnostic;
}

async function fetchLints(guid: string, version: string) {
  const { id: addonID, file_ids: fileIDs } = await getFromCache("addonMeta", [
    guid,
  ]);
  const fileID = fileIDs[version];

  if(!fileID || !addonID){
    return;
  }

  const url = `${constants.apiBaseURL}reviewers/addon/${addonID}/file/${fileID}/validation/`;

  const headers = await makeAuthHeader();
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorMessages: errorMessages = {
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

    await showErrorMessage(errorMessages, response.status, fetchLints, [guid]);

    return;
  }

  const json = await response.json();

  return json.validation;
}

export async function lintWorkspace() {
  const workspace = vscode.workspace.workspaceFolders?.at(0);
  if (!workspace) {
    return;
  }

  const { versionPath, guid, version } = await splitUri(workspace.uri);
  if (!versionPath) {
    return;
  }

  const { success, messages } = (await fetchLints(guid, version)) || [
    undefined,
    undefined,
  ];
  if (!success) {
    return;
  }

  const populateDiagnostic = async (messages: Message[]) => {
    for (const message of messages) {
      const diagnostic = await formatNotice(versionPath, message);
      if (diagnosticMap.has(message.file)) {
        diagnosticMap.get(message.file)?.push(diagnostic);
      } else {
        diagnosticMap.set(message.file, [diagnostic]);
      }
    }
  };

  const diagnosticCollection = getDiagnosticCollection();
  const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
  await populateDiagnostic(messages);

  diagnosticMap.forEach((diagnostics, file) => {
    const uri = getUriFromVersionPath(versionPath, file);
    diagnosticCollection.set(uri, diagnostics);
  });
}
