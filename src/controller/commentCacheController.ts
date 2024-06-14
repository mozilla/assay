import * as vscode from "vscode";

import { DirectoryController } from "./directoryController";
import { FileDecoratorController } from "./fileDecoratorController";
import { RangeController } from "./rangeController";
import { AssayCache } from "../model/cache";
import { CommentsCache, JSONComment, threadLocation } from "../types";
import getDeleteCommentsPreference from "../views/exportView";

export class CommentCacheController{

    constructor(private cache: AssayCache,
                private directoryController: DirectoryController,
                private sidebarController: FileDecoratorController,
                private rangeController: RangeController){}

    /**
     * Returns a boolean representing whether the provided uri has any comments.
     * @param uri The uri to check.
     * @returns whether the uri has comments.
     */
    fileHasComment = async (uri: vscode.Uri) => {
        const { guid, version, filepath } = await this.directoryController.splitUri(uri);
        const comments = await this.cache.getFromCache();
        if (comments?.[guid]?.[version]?.[filepath]) {
          return true;
        }
        return false;
    };

    /**
     * Save the given comment to cache.
     * @param comment
     */
    async saveCommentToCache(location: threadLocation, comment: JSONComment) {
        const { uri, guid, version, filepath, range } = location;
        await this.cache.addToCache(
            [guid, version, filepath, range],
            comment);
        this.sidebarController.loadFileDecoratorByUri(uri);
    }

    /**
     * Remove the given comment from cache.
     * @param comment
     */
    async deleteCommentFromCache(location: threadLocation) {
        const { uri, guid, version, filepath, range } = location;
        await this.cache.removeFromCache([guid, version, filepath, range]);
        this.sidebarController.loadFileDecoratorByUri(uri);
    }

    /*
    * Delete all comments associated with a given version of an add-on.
    * @param uri The URI of a file inside Assay's add-on cache. This will be used
    * to determine the add-on's GUID and version number.
    */
    // Deleting comments by [guid, version], while optimal,
    // is not compatible with VS Code's base FileDecorationProvider,
    // which requires the use of file uris directly.
    // To avoid iterating by each individual comment, we can knit together
    // the uri when iterating by file.
    async deleteComments(uri: vscode.Uri) {
        this.checkUri(uri);
        const { guid, version } = await this.directoryController.splitUri(uri);
        const rootPath = await this.directoryController.getRootFolderPath();
        const comments = await this.cache.getFromCache([guid, version]);

        for (const [filepath] of Object.entries(comments)) {
            // Delete the file in cache.
            await this.cache.removeFromCache([guid, version, filepath]);
            // Update the file's decorator.
            const commentUri = vscode.Uri.file(
                `${rootPath}/${guid}/${version}/${filepath}`
            );
            this.sidebarController.loadFileDecoratorByUri(commentUri);
        }
    }

    /**
     * Compiles existing comments into a string format.
     * @param guid The GUID of the comments to export.
     * @param version The version to export.
     * @returns string representation of the comments.
     */
    async compileComments(guid: string, version: string) {
        const comments = await this.cache.getFromCache([guid, version]);
        let compiledComments = "";

        for (const filepath in comments) {
            for (const lineNumber in comments[filepath]) {
            compiledComments += `File:\n${filepath}${this.rangeController.rangeTruncation(
                lineNumber
            )}\n\n`;
            const comment = comments[filepath][lineNumber].body;
            compiledComments += `${comment}\n\n`;
            }
        }
        return compiledComments;
    }

    /**
     * Handles exporting comments from the context.
     * @returns whether comments were deleted.
     */
    async exportCommentsFromContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return false;
        }
        const doc = editor.document;
        return await this.exportVersionComments(doc.uri);
    }

    /**
     * Handles exporting comments from the version uri resides in.
     * @param uri The selected uri.
     * @returns whether comments were deleted from uri.
     */
    async exportVersionComments(uri: vscode.Uri) {
        this.checkUri(uri, true);
        const { guid, version } = await this.directoryController.splitUri(uri);
        const comments = await this.compileComments(guid, version);
        return await this.exportCommentsToDocument(comments, uri);
    }

     /**
     * Fetches comments and returns an iterator.
     * @returns iterator function.
     */
    async getCachedCommentIterator() {
    const comments = await this.cache.getFromCache();
    return this.iterateByComment(comments);
    }

    /**
     * Exports comments to a TextDocument.
     * @param compiledComments The comments as a string.
     * @param uri The uri of the file with comments to (possibly) delete.
     * @returns whether comments were deleted from uri.
     */
    private async exportCommentsToDocument(
    compiledComments: string,
    uri: vscode.Uri
    ) {
        const document = await vscode.workspace.openTextDocument({
            content: compiledComments,
            language: "text",
        });

        vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);

        if (compiledComments) {
            vscode.env.clipboard.writeText(compiledComments);
            vscode.window.showInformationMessage("Comments copied to clipboard.");
        }

        const deleteCachedComments = await getDeleteCommentsPreference();
        if (deleteCachedComments) {
            await this.deleteComments(uri);
        }
        return deleteCachedComments;
    }  

    /**
     * Error-checking for uris that are passed into the controller.
     */
    private async checkUri(uri: vscode.Uri, strict?: boolean){
    const { rootFolder, fullPath, guid, version } = await this.directoryController.splitUri(uri);
        if (!fullPath.startsWith(rootFolder)) {
            vscode.window.showErrorMessage(
            "(Assay) File is not in the Addons root folder."
            );
            throw new Error("File is not in the root folder");
        }
    
        if (strict && (!guid || !version)) {
            vscode.window.showErrorMessage(
            "Not a valid path. Ensure you are at least as deep as the version folder."
            );
            throw new Error("No guid or version found");
        }
    }

    /**
     * Iterates through each comment in cache.
     * @param comments The raw cache object.
     */
    private *iterateByComment(comments: CommentsCache) {
        for (const guid in comments) {
            for (const version in comments[guid]) {
            for (const filepath in comments[guid][version]) {
                for (const lineNumber in comments[guid][version][filepath]) {
                yield {
                    ...comments[guid][version][filepath][lineNumber],
                    lineNumber,
                    filepath,
                    version,
                    guid,
                };
                }
            }
            }
        }
    }

}