import * as vscode from "vscode";

export function setReadOnlyEditor() {
  vscode.commands.executeCommand(
    "workbench.action.files.setActiveEditorReadonlyInSession"
  );
}
