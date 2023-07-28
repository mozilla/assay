import * as extract from "extract-zip";
import * as fs from "fs";
import * as vscode from "vscode";

async function dirExistsOrMake(dir: string) {
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir);
    return true;
  }
}

export async function extractAddon(
  compressedFilePath: string,
  addonFolderPath: string,
  addonVersionFolderPath: string
) {
  await dirExistsOrMake(addonFolderPath);

  if (!(await dirExistsOrMake(addonVersionFolderPath))) {
    const choice = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Addon already exists. Overwrite?",
    });
    if (choice === "No" || !choice) {
      await fs.promises.unlink(compressedFilePath);
      return;
    }
  }

  await extract(compressedFilePath, {
    dir: addonVersionFolderPath,
  });

  await fs.promises.unlink(compressedFilePath); // remove xpi

  if (!fs.existsSync(addonVersionFolderPath)) {
    vscode.window.showErrorMessage("Extraction failed");
    return;
  }

  vscode.window.showInformationMessage("Extraction complete");

  // make files read-only
  (await fs.promises.readdir(addonVersionFolderPath)).forEach((file) => {
    fs.chmodSync(`${addonVersionFolderPath}/${file}`, 0o444);
  });
}
