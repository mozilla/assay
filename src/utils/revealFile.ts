import * as vscode from "vscode";

import { stringToRange } from "./getThreadLocation";

export default async function revealFile(uri: vscode.Uri, lineNumber?: string) {
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