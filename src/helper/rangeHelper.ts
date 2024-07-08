import * as vscode from "vscode";

export class RangeHelper {
  /**
   * Splits a string into a start and end of a Range of lines.
   * @param str The string representation of the Range.
   * @returns The representation split into its individual line numbers.
   */
  static splitString(str: string) {
    const list = str.match(/\d+/g);
    if (!list || !/#L[0-9]+(-[0-9]+)?(?!-)/.test(str)) {
      throw Error(`Passed string is not a line number: ${str}`);
    }
    return {
      startLine: parseInt(list[0]),
      endLine: list.length > 1 ? parseInt(list[1]) : parseInt(list[0]),
    };
  }

  /**
   * Returns a VS Code Range from its string representation.
   * @param str The string to convert.
   * @param endCharacter the character to stop at. Defaults to 0.
   * @returns A VS Code Range
   */
  static async fromString(
    str: string,
    endCharacter: number | undefined = undefined
  ) {
    const { startLine, endLine } = RangeHelper.splitString(str);
    const startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, endCharacter ?? 0);
    return new vscode.Range(startPosition, endPosition);
  }

  /**
   * Returns a VS Code Range as its string representation.
   * @param range
   * @returns The string representation of the Range.
   */
  static toString(range: vscode.Range) {
    return range.start.line === range.end.line
      ? `#L${range.start.line}`
      : `#L${range.start.line}-${range.end.line}`;
  }

  /**
   * Adjusts the range string to account for lines starting from 1 in the editor rather than 0 in the backend.
   * Use this whenever the line number is exposed to the user.
   * @param str
   * @returns The truncated range string.
   */
  static truncate(str: string) {
    const { startLine, endLine } = RangeHelper.splitString(str);
    return startLine === endLine
      ? `#L${startLine + 1}`
      : `#L${startLine + 1}-${endLine + 1}`;
  }
}
