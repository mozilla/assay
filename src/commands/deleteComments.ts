import * as vscode from "vscode";

import { getCommentManager } from "../config/globals";
import { splitUri } from "../utils/splitUri";

export async function deleteCommentsFromContext(uri: vscode.Uri) {
  const { guid, version } = await splitUri(uri);
  const cmtManager = getCommentManager();
  cmtManager.deleteVersionComments(guid, version);
}
