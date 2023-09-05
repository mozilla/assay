import * as vscode from 'vscode';

export function getLineInfo() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const filepath = editor.document.fileName;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    const selectedLine = editor.document.lineAt(selection.start.line);

    const lineStart = selectedLine.range.start.line + 1;
    const lineEnd = lineStart + selectedText.split("\n").length - 1;

    console.log("filepath: ", filepath);
    console.log("selectedText: ", selectedText);
    console.log("lineNumbers: ", lineStart, lineEnd);

    return {
        'filepath': filepath,
        'selectedText': selectedText,
        'lineStart': lineStart,
        'lineEnd': lineEnd
    };
}