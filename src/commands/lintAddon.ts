import * as linter from 'addons-linter';
import * as fs from 'fs';
import { existsSync } from 'node:fs';
import * as vscode from "vscode";

import { addonInfoResponse } from '../types';
import { getAddonInfo } from "../utils/addonInfo";
import { getVersionChoice } from "../utils/addonVersions";
import { makeAuthHeader } from "../utils/requestAuth";
import { getRootFolderPath } from '../utils/reviewRootDir';

export async function lintAddonLocally() {
  const fsInput = await vscode.window.showInputBox({
    prompt: "Enter path to Addon (local file system)",
    title: "Lint AMO Addon Locally",
    ignoreFocusOut: true,
  });

  if (!fsInput) {
    vscode.window.showErrorMessage("lintAddonLocally failed, no input provided");
    throw new Error("lintAddonLocally failed, no input provided!");
  }

  if (!existsSync(fsInput)) {
    vscode.window.showErrorMessage("lintAddonLocally failed, the file path doesn't exist in local file system");
    throw new Error("lintAddonLocally failed, the file path doesn't exist in local file system!");
  }

  /**
   * Check the console to see where Assay is storing your extension downloads,
   * this is where it will store the text file containing addons-linter results.
   */
  const workspaceFolder = await getRootFolderPath();
  console.log("workspaceFolder:" + workspaceFolder);

  const linterOptions: linter.Options = {
    config: {
        _: [fsInput],
        logLevel: process.env.VERBOSE ? 'debug' : 'fatal',
        stack: Boolean(process.env.VERBOSE),
        pretty: true,
        warningsAsErrors: false,
        metadata: false,
        output: 'none',
        boring: false,
        selfHosted: false,
    },
    runAsBinary: false,
  };
  console.log("LinterOptions:" + linterOptions.config._);
  let data = "";
  let message = "";
  try {
    const instance = linter.createInstance(linterOptions);
    const lintResults = await instance.run();
    
    console.log(`Summary: [Warnings: ${lintResults.summary.warnings.toString()}], [Errors: ${lintResults.summary.errors.toString()}], [Notices: ${lintResults.summary.notices.toString()}]`);
    data += `Summary: [Warnings: ${lintResults.summary.warnings.toString()}], [Errors: ${lintResults.summary.errors.toString()}], [Notices: ${lintResults.summary.notices.toString()}]`;
    let i = lintResults.errors.length;
    if(i > 0) {
      for (i = 0; i < lintResults.errors.length; i++) {
        console.log(lintResults.errors[i]);
        message = `Message {_type: ${lintResults.errors[i]._type.toString()}, message: ${lintResults.errors[i].message.toString()}, description: ${lintResults.errors[i].description.toString()}}`;
        data += "\n" + message;
      }
    }

    i = lintResults.warnings.length;
    if(i > 0) {
      for (i = 0; i < lintResults.warnings.length; i++) {
        console.log(lintResults.warnings[i]);
        message = `Message {_type: ${lintResults.warnings[i]._type.toString()}, message: ${lintResults.warnings[i].message.toString()}, description: ${lintResults.warnings[i].description.toString()}}`;
        data += "\n" + message;
      }
    }

    i = lintResults.notices.length;
    if(i > 0) {
      for (i = 0; i < lintResults.notices.length; i++) {
        console.log(lintResults.notices[i]);
        message = `Message {_type: ${lintResults.notices[i]._type.toString()}, message: ${lintResults.notices[i].message.toString()}, description: ${lintResults.notices[i].description.toString()}}`;
        data += "\n" + message;
      }
    }
    

  } catch (err) {
    console.error("addons-linter failed in lintAddonLocally function: ", err);
  }

  const parts = linterOptions.config._[0].split("/");
  const fileName = parts.slice(-2).join('_');

  console.log("fileName:" + fileName);
  const dest = fs.createWriteStream(`${workspaceFolder}/${fileName}_lintResults.txt`, { flags: "w" });
  dest.write(data);

}

export async function lintAddonApi() {
  const fsInput = await vscode.window.showInputBox({ // TODO: What input could uniquely identify the extension?
    prompt: "Enter path the GUID of addon",
    title: "Lint AMO Addon Via Addons API",
    ignoreFocusOut: true,
  });

  if (!fsInput) {
    vscode.window.showErrorMessage("lintAddonApi failed, no input provided");
    throw new Error("lintAddonApi failed, no input provided!");
  }

  // if (!existsSync(fsInput)) {
  //   vscode.window.showErrorMessage("lintAddonApi failed, the file path doesn't exist in local file system");
  //   throw new Error("lintAddonApi failed, the file path doesn't exist in local file system!");
  // }

  try {
    const json: addonInfoResponse = await getAddonInfo(fsInput);
    console.log("json:" + json.review_url);

    const versionInfo = await getVersionChoice(fsInput);
    console.log("versionInfo:" + versionInfo.fileID + " " + versionInfo.version);
    const addonFileId = versionInfo.fileID;
    const addonVersion = versionInfo.version;
    const addonGUID = json.guid;

    console.log("addonFileId:" + addonFileId, "addonVersion:" + addonVersion, "addonGUID:" + addonGUID);

    const url = `https://addons-dev.allizom.org/api/v5/reviewers/addon/${fsInput}/file/${versionInfo.fileID}/validation/?lang=en-US`;
    const headers = await makeAuthHeader();
    const response = await fetch(url, { headers });
    const data = await response.json();
    //Get {detail: 'Authentication credentials were not provided.'} error from API
    console.log(data);
    
  } catch (err) {
    console.error("addons-linter failed in lintAddonApi function: ", err);
  }
}
