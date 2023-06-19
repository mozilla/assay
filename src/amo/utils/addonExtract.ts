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
  vscode.window.withProgress(
    { title: "Assay", location: vscode.ProgressLocation.Notification },
    function (progress) {
      progress.report({
        message: "Extracting",
      });

      return new Promise((resolve, reject) => {
        dirExistsOrMake(addonFolderPath);
        if (!dirExistsOrMake(addonVersionFolderPath)) {
          vscode.window
            .showQuickPick(["Yes", "No"], {
              placeHolder: "Addon already exists. Overwrite?",
            })
            .then((choice) => {
              if (choice === "No" || !choice) {
                fs.unlinkSync(compressedFilePath);
                reject(new Error("Extraction cancelled"));
              }
            });
        }


        extract(compressedFilePath, {
          dir: addonVersionFolderPath,
        }).then(() => {
          fs.unlinkSync(compressedFilePath); // remove xpi

          if (!fs.existsSync(addonVersionFolderPath)) {
            vscode.window.showErrorMessage("Extraction failed");
            return Promise.reject(new Error("Extraction failed"));
          }

          vscode.window.showInformationMessage("Extraction complete");

          // make files read-only
          fs.readdirSync(addonVersionFolderPath).forEach((file) => {
            fs.chmodSync(`${addonVersionFolderPath}/${file}`, 0o444);
          });

          resolve(null);
        });
      });
    }
  );
}
