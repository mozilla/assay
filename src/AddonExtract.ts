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

  if (!fs.existsSync(workspaceFolder + "/" + addonSlug)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }
  vscode.window.showInformationMessage("Extraction complete");
  fs.unlinkSync(compressedFilePath); // remove xpi

  // make files read-only
  // fs.readdirSync(workspaceFolder + "/" + addonSlug).forEach((file) => {
  //   fs.chmodSync(workspaceFolder + "/" + addonSlug + "/" + file, 0o444);
  // });
}
