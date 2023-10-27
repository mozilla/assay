import { loadFileComments } from "./loadComments";
import { addToCache } from "../utils/addonCache";
import { getLineInfo } from "../utils/lineComment";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function removeCommentFromCurrentLine() {
  const lineInfo = getLineInfo();
  if (!lineInfo) {
    return;
  }

  const fullpath = lineInfo.fullpath;
  const lineNumber = lineInfo.lineNumber;

  const rootDir = await getRootFolderPath();
  const relativePath = fullpath.replace(rootDir, "");
  const guid = relativePath.split("/")[1];
  const keys = relativePath.split("/").slice(2);

  await addToCache(guid, [...keys, lineNumber], "");
  await loadFileComments();
  return true;
}
