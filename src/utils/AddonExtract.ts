import * as vscode from "vscode";
import * as fs from "fs";

export async function extractAddon(
  compressedFilePath: string,
  workspaceFolder: string,
  addonGUID: string,
  addonVersion: string
) {
  if (!fs.existsSync(workspaceFolder + "/" + addonGUID)) {
    fs.mkdirSync(workspaceFolder + "/" + addonGUID);
  }

  if (!fs.existsSync(workspaceFolder + "/" + addonGUID + "/" + addonVersion)) {
    fs.mkdirSync(workspaceFolder + "/" + addonGUID + "/" + addonVersion);
  } else {
    const choice = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Addon already exists. Overwrite?",
    });
    if (choice === "No") {
      fs.unlinkSync(compressedFilePath);
      return;
    }
  }

  const extract = require("extract-zip");
  await extract(
    compressedFilePath,
    { dir: workspaceFolder + "/" + addonGUID + "/" + addonVersion },
    function (err: any) {
      if (err) {
        console.log(err);
      }
    }
  );

  fs.unlinkSync(compressedFilePath); // remove xpi

  if (!fs.existsSync(workspaceFolder + "/" + addonGUID + "/" + addonVersion)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }

  vscode.window.showInformationMessage("Extraction complete");

  // make files read-only
  fs.readdirSync(
    workspaceFolder + "/" + addonGUID + "/" + addonVersion
  ).forEach((file) => {
    fs.chmodSync(
      workspaceFolder + "/" + addonGUID + "/" + addonVersion + "/" + file,
      0o444
    );
  });
}
