import * as vscode from "vscode";

import { splitUri } from "./splitUri";
import { AssayThread } from "../config/comment";

export default async function getCommentLocation(thread: AssayThread) {
  const range = rangeToString(thread.range);
  const { guid, version, filepath } = await getFilepathInfo(thread);
  return { guid, version, filepath, range: range };
}

async function getFilepathInfo(thread: AssayThread) {
  const { rootFolder, fullPath, guid, version, filepath } = await splitUri(
    thread.uri
  );
  if (!fullPath.startsWith(rootFolder)) {
    vscode.window.showErrorMessage(
      "(Assay) File is not in the Addons root folder."
    );
    throw new Error("File is not in the root folder.");
  }
  return { guid, version, filepath };
}

export function rangeToString(range: vscode.Range) {
  return range.start.line === range.end.line
    ? `#L${range.start.line}`
    : `#L${range.start.line}-${range.end.line}`;
}

export function stringToRange(str: string) {
  const list = str.match(/\d+/g);
  if (!list || !/#L[0-9]+(-[0-9]+)?/.test(str)) {
    throw Error(`Passed string is not a line number: ${str}`);
  }
  const start = new vscode.Position(parseInt(list[0]), 0);
  const end =
    list.length > 1 ? new vscode.Position(parseInt(list[1]), 0) : start;
  return new vscode.Range(start, end);
}

// adjusts the range string to account for lines starting from 1 in the editor rather than 0 in the backend.
// use this whenever the line number is exposed to the user.
export function rangeTruncation(str: string) {
  const list = str.match(/\d+/g);
  if (!list || !/#L[0-9]+(-[0-9]+)?/.test(str)) {
    throw Error(`Passed string is not a line number: ${str}`);
  }
  const start = parseInt(list[0]);
  const end = list.length > 1 ? parseInt(list[1]) : start;
  return start === end ? `#L${start + 1}` : `#L${start + 1}-${end + 1}`;
}
