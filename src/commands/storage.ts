import * as vscode from "vscode";

import { loadFileDecorator } from "./loadComments";
import { AssayComment } from "../class/comment";
import { addToCache, getFromCache } from "../utils/addonCache";
import createComment from '../utils/createComment';
import getCommentLocation, { stringToRange } from "../utils/getCommentLocation";
import { getRootFolderPath } from "../utils/reviewRootDir";

// TODO: Modify read
export async function fetchCommentsFromCache(controller: vscode.CommentController){

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const doc = editor.document;
    const fullPath = doc.uri.fsPath;
    const rootFolder = await getRootFolderPath();
    if (!fullPath.startsWith(rootFolder)) {
        return;
    }

    const relativePath = fullPath.replace(rootFolder, "");
    const guid = relativePath.split("/")[1];
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