import * as vscode from 'vscode';

import { loadFileDecorator } from "./loadComments";
import { AssayComment } from "../class/comment";
import { addToCache, getFromCache } from "../utils/addonCache";
import getCommentLocation from "../utils/getCommentLocation";
import { getRootFolderPath } from "../utils/reviewRootDir";

export async function fetchCommentsFromCache(){

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
  const keys = relativePath.split("/").slice(2);

  const comments = await getFromCache(guid, keys);


  // TODO: this should (preferably) occur on launch only --
  // for each comment, create it in the environment.





  console.log(comments);

  // if a comment doesn't exist here, add it.


}

export async function saveCommentToCache(comment: AssayComment){
    updateCommentInCache(comment, comment.savedBody.value);
}

export async function deleteCommentFromCache(comment: AssayComment){
    updateCommentInCache(comment, "");
}

async function updateCommentInCache(comment: AssayComment, value: string){
    const {guid, version, filepath, start} = await getCommentLocation(comment.thread);
    const pathParts = filepath.split("/").slice(1);

    await addToCache(
      guid,
      [version, ...pathParts, start.toString()],
      value
    );
    await loadFileDecorator();
}