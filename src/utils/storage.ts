import * as vscode from "vscode";

import { addToCache, getFromCache } from "./addonCache";
import { createComment } from "./comment";
import getCommentLocation, {  stringToRange } from "./getCommentLocation";
import { loadFileDecorator } from "./loadComments";
import { splitUri } from "./splitUri";
import { AssayComment } from "../config/comment";

export async function fetchCommentsFromCache(controller: vscode.CommentController){
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
      return;
  }

  const doc = editor.document;
  const {rootFolder, fullPath, guid} = await splitUri(doc.uri);
  
  if (!fullPath.startsWith(rootFolder)) {
      return;
  }

  const comments = await getFromCache(guid, ['comments']);

  for(const version in comments){
    for (const filepath in comments[version]) {
        for (const lineNumber in comments[version][filepath]) {
          const {uri, body, contextValue} = comments[version][filepath][lineNumber];
            const r = stringToRange(lineNumber);
            const thread = controller.createCommentThread(uri, r, []);
            createComment(contextValue, new vscode.MarkdownString(body), thread);
        }
      }
  }
}

export async function saveCommentToCache(comment: AssayComment){
    const {guid, version, filepath, range} = await getCommentLocation(comment.thread);
    await addToCache(
      guid,
      ['comments', version, filepath, range],
      comment
    );
}

export async function deleteCommentFromCache(comment: AssayComment){
    const {guid, version, filepath, range} = await getCommentLocation(comment.thread);
    await addToCache(
      guid,
      ['comments', version, filepath, range],
      ""
    );
    await loadFileDecorator();
}