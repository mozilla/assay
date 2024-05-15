import * as vscode from 'vscode';

import { getRootFolderPath } from "./reviewRootDir";
import { AssayThread } from "../class/comment";

export default async function getCommentLocation(thread: AssayThread){
    const range = rangeToString(thread.range);
    const { guid, version, filepath } = await getFilepathInfo(thread);
    const string = `${filepath}${range}`;
    return {string, guid, version, filepath, range: range};
}

async function getFilepathInfo(thread: AssayThread){
    const {fullPath, guid, version, filepath} = await splitUri(thread.uri);
    const rootFolder = await getRootFolderPath();
    if (!fullPath.startsWith(rootFolder)) {
        vscode.window.showErrorMessage("(Assay) File is not in the Addons root folder.");
        throw new Error("File is not in the root folder.");
    }
    return {guid, version, filepath};
}


export function rangeToString(range: vscode.Range){
    return range.start.line === range.end.line ? `#L${range.start.line}` : `#L${range.start.line}-${range.end.line}`;
}


export function stringToRange(str: string){
    const list = str.match(/\d+/g);
    if(!list || !/#L[0-9]+(-[0-9]+)?/.test(str)){
        throw Error(`Passed string is not a line number: ${str}`);
    }
    const start = new vscode.Position(parseInt(list[0]), 0);
    const end = list.length > 1 ? new vscode.Position(parseInt(list[1]), 0) : start;
    return new vscode.Range(start, end);
}

// TODO: replace instances to use this
export async function splitUri(uri: vscode.Uri){
    const fullPath = uri.fsPath;
    const rootDir = await getRootFolderPath();
    const relativePath = fullPath.replace(rootDir, "");
    const guid = relativePath.split("/")[1];
    const version = relativePath.split("/")[2];
    const filepath = relativePath.split(version)[1];
    return {fullPath, relativePath, guid, version, filepath};
}