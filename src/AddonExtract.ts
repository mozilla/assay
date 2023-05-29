import * as vscode from "vscode";
import * as fs from "fs";

export async function extractAddon(
  compressedFilePath: string,
  workspaceFolder: string,
  addonSlug: string
) {
  const extract = require("extract-zip");
  await extract(
    compressedFilePath,
    { dir: workspaceFolder + "/" + addonSlug },
    function (err: any) {
      if (err) {
        console.log(err);
      }
    }
  );

  // check if extracted folder exists
  if (!fs.existsSync(workspaceFolder + "/" + addonSlug)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }
  vscode.window.showInformationMessage("Extraction complete");
  fs.unlinkSync(compressedFilePath);
}
