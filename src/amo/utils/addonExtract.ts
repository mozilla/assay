import * as extract from "extract-zip";
import * as fs from "fs";
import * as vscode from "vscode";

function dirExistsOrMake(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    return true;
  }
}

export async function extractAddon(
  compressedFilePath: string,
  addonFolderPath: string,
  addonVersionFolderPath: string
) {
  dirExistsOrMake(addonFolderPath);

  if (!dirExistsOrMake(addonVersionFolderPath)) {
    const choice = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Addon already exists. Overwrite?",
    });
    if (choice === "No" || !choice) {
      fs.unlinkSync(compressedFilePath);
      throw new Error("Extraction cancelled");
    }
  }

  await extract(compressedFilePath, {
    dir: addonVersionFolderPath,
  });

  fs.unlinkSync(compressedFilePath); // remove xpi

  if (!fs.existsSync(addonVersionFolderPath)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }

  vscode.window.showInformationMessage("Extraction complete");

  // make files read-only
  fs.readdirSync(addonVersionFolderPath).forEach((file) => {
    fs.chmodSync(`${addonVersionFolderPath}/${file}`, 0o444);
  });
}
