import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CommentCacheController } from "../../../src/controller/commentCacheController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { FileDecoratorController } from "../../../src/controller/fileDecoratorController";
import { RangeController } from "../../../src/controller/rangeController";
import { AssayCache } from "../../../src/model/cache";


let assayCacheStub, directoryControllerStub: DirectoryController, fileDecoratorControllerStub, rangeControllerStub: RangeController;
let commentCacheController: CommentCacheController;


describe("commentCacheController.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {

    assayCacheStub = sinon.createStubInstance(AssayCache);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    fileDecoratorControllerStub = sinon.createStubInstance(FileDecoratorController);
    rangeControllerStub = sinon.createStubInstance(RangeController);

    sinon.stub(DirectoryController.prototype, "getRootFolderPath").resolves("/test-root");
    // sinon.stub(DirectoryController.prototype, "splitUri");
    // sinon.stub(RangeController.prototype, "rangeTruncation");

    commentCacheController = new CommentCacheController(assayCacheStub, directoryControllerStub, fileDecoratorControllerStub, rangeControllerStub);

  });

  describe("compileComments()", () => {

    it("should return the compiled comments.", async () => {
      sinon.stub(AssayCache.prototype, "getFromCache").resolves({
        "/test-filepath": {
          "#L1": {
            "body": "test-comment"
          },
        },
      });

      const result = await commentCacheController.compileComments("guid", "version");
      expect(result).to.contain("test-filepath");
      expect(result).to.contain("#L2");
      expect(result).to.contain("test-comment");
    });
  });

  describe("exportCommentsFromContext()", () => {

    it("should throw an error if the file is not in the root folder.", async () => {
      const editor = {
        document: {
          uri: {
            fsPath: "/test-filepath",
          },
        },
      } as vscode.TextEditor;
      sinon.stub(vscode.window, "activeTextEditor").get(() => editor);

      try {
        await commentCacheController.exportVersionComments(vscode.Uri.file("/not-root"));
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid or version.", async () => {
      const editor = {
        document: {
          uri: {
            fsPath: "/test-root",
          },
        },
      } as vscode.TextEditor;
      sinon.stub(vscode.window, "activeTextEditor").get(() => editor);

      try {
        await commentCacheController.exportVersionComments(vscode.Uri.file("/test-root"));
      } catch (err: any) {
        expect(err.message).to.equal("No guid or version found");
      }
    });
  });
  
  describe("deleteComments", () => {
    it("should delete all comments in the URI's GUID and version.", async () => {
      sinon.stub(Object, 'entries').returns([
        ["filepath", "comments"]
      ]);
      const deleteCommentFromCacheStub = sinon.stub(CommentCacheController.prototype, "deleteCommentFromCache");
      const loadFileDecoratorStub = sinon.stub(FileDecoratorController.prototype, "loadFileDecoratorByUri");

      await commentCacheController.deleteComments(vscode.Uri.file("/test-root/guid/version"));
      expect(deleteCommentFromCacheStub.called).to.be.true;
      expect(loadFileDecoratorStub.called).to.be.true;
    });
  });

  describe("exportVersionComments", () => {

    it("should open an information message.", async () => {

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );

      const removeFromCacheStub = sinon.stub(AssayCache.prototype, "removeFromCache");
      const fileDecoratorStub = sinon.stub(FileDecoratorController.prototype, "loadFileDecoratorByUri");
      
      await commentCacheController.exportVersionComments(vscode.Uri.file("guid"));
      expect(removeFromCacheStub.called).to.be.true;
      expect(fileDecoratorStub.called).to.be.true;

      vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      expect(showInformationMessageStub.called).to.be.true;

    });

    
  });

});
