import * as vscode from "vscode";

import { DirectoryController } from "./directoryController";

export class RangeController {
  constructor(private directoryController: DirectoryController) {}

  /**
   * Returns a VS Code Range as its string representation.
   * @param range
   * @returns The string representation of the Range.
   */
  rangeToString(range: vscode.Range) {
    return range.start.line === range.end.line
      ? `#L${range.start.line}`
      : `#L${range.start.line}-${range.end.line}`;
  }

  /**
   * Returns a VS Code Range from its string representation.
   * @param str The string to convert.
   * @param uri The location of the Range, if any
   * @returns A VS Code Range
   */
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
      const buffer = await this.directoryController.readFile(uri);
      const content = buffer?.toString()?.split("\n");
      endCharacter = content[endLine]?.length;
    }

    const startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, endCharacter ?? 0);

    return new vscode.Range(startPosition, endPosition);
  }

  /**
   * Adjusts the range string to account for lines starting from 1 in the editor rather than 0 in the backend.
   * Use this whenever the line number is exposed to the user.
   * @param str
   * @returns The truncated range string.
   */
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
