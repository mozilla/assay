import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CommentCacheController } from "../../../src/controller/commentCacheController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { FileDecoratorController } from "../../../src/controller/fileDecoratorController";
import { RangeController } from "../../../src/controller/rangeController";
import { AssayCache } from "../../../src/model/cache";
import * as exportView from "../../../src/views/exportView";


let assayCacheStub: sinon.SinonStubbedInstance<AssayCache>,
directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>,
fileDecoratorControllerStub: sinon.SinonStubbedInstance<FileDecoratorController>, 
rangeControllerStub: RangeController;
let commentCacheController: CommentCacheController;


describe("commentCacheController.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {

    assayCacheStub = sinon.createStubInstance(AssayCache);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    fileDecoratorControllerStub = sinon.createStubInstance(FileDecoratorController);
    rangeControllerStub = new RangeController(directoryControllerStub);

    directoryControllerStub.getRootFolderPath.resolves("/test-root");

    commentCacheController = new CommentCacheController(assayCacheStub, directoryControllerStub, fileDecoratorControllerStub, rangeControllerStub);

  });

  describe("compileComments()", () => {
    it("should return the compiled comments.", async () => {
      assayCacheStub.getFromCache.resolves({
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

  describe("checkUri()", () => {
    it("should throw an error if the file is not in the root folder.", async () => {
      directoryControllerStub.splitUri.resolves({rootFolder: "/test-root", fullPath: "/not-root"} as any);
      try {
        await commentCacheController["checkUri"](vscode.Uri.file("/not-root"));
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid or version.", async () => {
      directoryControllerStub.splitUri.resolves({rootFolder: "/test-root", fullPath: "/test-root"} as any);
      try {
        await commentCacheController["checkUri"](vscode.Uri.file("/test-root"));
      } catch (err: any) {
        expect(err.message).to.equal("No guid or version found");
      }
    });
  });
  
  describe("deleteComments", () => {
    it("should delete all comments in the URI's GUID and version.", async () => {
      directoryControllerStub.splitUri.resolves({rootFolder: "/test-root",
      guid: "guid", version: "version"} as any);

      sinon.stub(Object, 'entries').returns([
        ["filepath", "comments"]
      ]);

      await commentCacheController.deleteComments(vscode.Uri.file("/test-root/guid/version"));
      expect(assayCacheStub.removeFromCache.called).to.be.true;
      expect(fileDecoratorControllerStub.loadFileDecoratorByUri.called).to.be.true;
    });
  });

  describe("exportVersionComments", () => {
    it("should open an information message.", async () => {
      assayCacheStub.getFromCache.resolves({
        "/test-filepath": {
          "#L1": {
            "body": "test-comment"
          },
        },
      });

      directoryControllerStub.splitUri.resolves({rootFolder: "/test-root",
      guid: "guid", version: "version"} as any);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );

      const getPreferenceStub = sinon.stub(exportView, "getDeleteCommentsPreference");
      getPreferenceStub.resolves(false);

      await commentCacheController.exportVersionComments(vscode.Uri.file("guid"));
      vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      expect(showInformationMessageStub.called).to.be.true;
    });
  });

});
