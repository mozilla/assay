import * as vscode from "vscode";

import { getRootFolderPath } from "./reviewRootDir";

export async function getCommentLocation(thread: vscode.CommentThread){
    const lineNo = getCommentLine(thread);
    const path = await getRelativePath(thread);
    const string = `${path}${lineNo.start === lineNo.end ? `#L${lineNo.start}` : `#L${lineNo.start}-${lineNo.end}`}`;
    return string;
}

export async function getRelativePath(thread: vscode.CommentThread){

    const fullPath = thread.uri.fsPath;
    const rootDir = await getRootFolderPath();
    const relativePath = fullPath.replace(rootDir, "");

    const rootFolder = await getRootFolderPath();
    if (!fullPath.startsWith(rootFolder)) {
        throw new Error("File is not in the root folder");
    }

    return relativePath;
}

export function getCommentLine(thread: vscode.CommentThread){
    return {start: thread.range.start.line, end: thread.range.end.line};
}