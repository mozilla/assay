import * as vscode from "vscode";

export function getLineInfo() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const fullpath = editor.document.fileName;
  const selection = editor.selection;
  const selectedLine = editor.document.lineAt(selection.start.line);
  const lineNumber = (selectedLine.range.start.line + 1).toString();

  return {
    fullpath,
    lineNumber,
  };
}
