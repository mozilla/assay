import * as extract from "extract-zip";
import * as fs from "fs";
import * as vscode from "vscode";

import { showErrorMessage } from "./processErrors";
import { QPOption, errorMessages } from "../types";

export async function dirExistsOrMake(dir: string) {
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
    const choice = await vscode.window.showQuickPick(
      [QPOption.Yes, QPOption.No],
      {
        placeHolder: "Addon already exists. Overwrite?",
      }
    );
    if (choice === QPOption.No || !choice) {
      await fs.promises.unlink(compressedFilePath);
      throw new Error("Extraction cancelled");
    }
  }

  await extract(compressedFilePath, {
    dir: addonVersionFolderPath,
  });

  await fs.promises.unlink(compressedFilePath); // remove xpi

  if (!fs.existsSync(addonVersionFolderPath)) {
    const errorMessages: errorMessages = {
      window: {
        other: `Extraction failed. Could not find ${addonVersionFolderPath}`,
      },
      thrown: {
        other: "Extraction failed",
      },
    };

    return await showErrorMessage(errorMessages, "other", extractAddon, [
      compressedFilePath,
      addonFolderPath,
      addonVersionFolderPath,
    ]);
  }

  vscode.window.showInformationMessage("Extraction complete");

  // make files read-only
  // (await fs.promises.readdir(addonVersionFolderPath)).forEach((file) => {
  //   fs.chmodSync(`${addonVersionFolderPath}/${file}`, 0o444);
  // });
}
