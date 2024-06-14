import * as vscode from "vscode";

import { FileDirectoryController } from "./fileDirectoryController";


export class RangeController{

    constructor(private fileDirectoryController: FileDirectoryController){}

    rangeToString(range: vscode.Range) {
    return range.start.line === range.end.line
        ? `#L${range.start.line}`
        : `#L${range.start.line}-${range.end.line}`;
    }

    async stringToRange(str: string, uri?: vscode.Uri) {
    const list = str.match(/\d+/g);
    if (!list || !/#L[0-9]+(-[0-9]+)?(?!-)/.test(str)) {
        throw Error(`Passed string is not a line number: ${str}`);
    }

    let endCharacter = undefined;
    const startLine = parseInt(list[0]);
    const endLine = list.length > 1 ? parseInt(list[1]) : startLine;

    // if given a file URI, set the the end range to eol
    if (uri) {
        const buffer = await this.fileDirectoryController.readFile(uri);
        const content = buffer?.toString()?.split("\n");
        endCharacter = content[endLine]?.length;
    }

    const startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, endCharacter ?? 0);

    return new vscode.Range(startPosition, endPosition);
    }

    // adjusts the range string to account for lines starting from 1 in the editor rather than 0 in the backend.
    // use this whenever the line number is exposed to the user.
    rangeTruncation(str: string) {
    const list = str.match(/\d+/g);
    if (!list || !/#L[0-9]+(-[0-9]+)?(?!-)/.test(str)) {
        throw Error(`Passed string is not a line number: ${str}`);
    }
    const start = parseInt(list[0]);
    const end = list.length > 1 ? parseInt(list[1]) : start;
    return start === end ? `#L${start + 1}` : `#L${start + 1}-${end + 1}`;
    }

}
