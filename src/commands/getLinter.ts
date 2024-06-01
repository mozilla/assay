import * as linter from "addons-linter";
import * as vscode from "vscode";

import { splitUri } from "../utils/splitUri";

export async function lintWorkspace(){
    const workspace = vscode.workspace.workspaceFolders?.at(0);
    if(!workspace){
        return;
    }
    const uri = workspace.uri;

    const diagnostics = vscode.languages.createDiagnosticCollection("addons-linter");

    const { rootFolder } = await splitUri(uri);

    console.log("launch", rootFolder);

    const linterOptions: linter.Options = {
        config: {
                _: [rootFolder],
                logLevel: process.env.VERBOSE ? "debug" : "fatal",
                stack: Boolean(process.env.VERBOSE),
                pretty: true,
                warningsAsErrors: false,
                metadata: false,
                output: "none",
                boring: false,
                selfHosted: false
            },
            runAsBinary: false,
        };

    const instance = linter.createInstance(linterOptions);
    const lintResults = await instance.run();

    console.log(lintResults);

        // for each file result,
        // set(uri, diagnostics[])

}

export async function updateFileLint(event: vscode.TextDocumentChangeEvent){

    const { document, reason } = event;

    const { rootFolder, filepath } = await splitUri(document.uri);

    console.log(reason, rootFolder, " and ", filepath);

    const linterOptions: linter.Options = {
        config: {
                _: [rootFolder],
                logLevel: process.env.VERBOSE ? "debug" : "fatal",
                stack: Boolean(process.env.VERBOSE),
                pretty: true,
                warningsAsErrors: false,
                metadata: false,
                output: "none",
                boring: false,
                selfHosted: false,
                scanFile: [filepath]
            },
            runAsBinary: false,
        };

        // set(uri, diagnostics[])
}