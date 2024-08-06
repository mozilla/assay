import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CommentCacheController } from "../../../src/controller/commentCacheController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { FileDecoratorController } from "../../../src/controller/fileDecoratorController";
import { AssayCache } from "../../../src/model/assayCache";
import { ExportView } from "../../../src/views/exportView";

let assayCacheStub: sinon.SinonStubbedInstance<AssayCache>,
  directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>,
  fileDecoratorControllerStub: sinon.SinonStubbedInstance<FileDecoratorController>;
let commentCacheController: CommentCacheController;

describe("commentCacheController.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    assayCacheStub = sinon.createStubInstance(AssayCache);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    fileDecoratorControllerStub = sinon.createStubInstance(
      FileDecoratorController
    );
    commentCacheController = new CommentCacheController(
      assayCacheStub,
      directoryControllerStub,
      fileDecoratorControllerStub
    );

    directoryControllerStub.getRootFolderPath.resolves("/test-root");
  });

  describe("compileComments()", () => {
    it("should return the compiled comments.", async () => {
      assayCacheStub.getFromCache.resolves({
        "/test-filepath": {
          "#L1": {},
        },
      });

      const result = await commentCacheController.compileComments(
        "guid",
        "version"
      );
      expect(result).to.contain("test-filepath");
      expect(result).to.contain("#L2");
    });
  });

  describe("deleteComments", () => {
    it("should delete all comments in the URI's GUID and version.", async () => {
      directoryControllerStub.splitUri.resolves({
        rootFolder: "/test-root",
        guid: "guid",
        version: "version",
      } as any);

      sinon.stub(Object, "entries").returns([["filepath", "comments"]]);

      await commentCacheController.deleteComments(
        vscode.Uri.file("/test-root/guid/version")
      );
      expect(assayCacheStub.removeFromCache.called).to.be.true;
      expect(fileDecoratorControllerStub.loadFileDecoratorByUri.called).to.be
        .true;
    });
  });

  describe("exportVersionComments", () => {
    it("should open an information message.", async () => {
      assayCacheStub.getFromCache.resolves({
        "/test-filepath": {
          "#L1": {},
        },
      });

      directoryControllerStub.splitUri.resolves({
        rootFolder: "/test-root",
        guid: "guid",
        version: "version",
      } as any);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );

      const getPreferenceStub = sinon.stub(
        ExportView,
        "getDeleteCommentsPreference"
      );
      getPreferenceStub.resolves(false);

      await commentCacheController.exportVersionComments(
        vscode.Uri.file("guid")
      );
      vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      expect(showInformationMessageStub.called).to.be.true;
    });
  });

  describe("fileHasComment()", async () => {
    it("should return false if there are no comments in file.", async () => {
      assayCacheStub.getFromCache.resolves({
        "test-guid": {
          "test-version-1": {
            "filepath-one": {
              "#L1": {
                uri: vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version-1/filepath-one"
                ),
              },
            },
          },
          "test-version-2": {
            "filepath-two": {
              "#L1": {
                uri: vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version-2/filepath-two"
                ),
              },
            },
          },
        },
      });
      directoryControllerStub.splitUri.resolves({
        guid: "test-guid",
        version: "test-version",
        filepath: "test-filepath",
      } as any);

      const result = await commentCacheController.fileHasComment(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );

      expect(result).to.be.false;
    });

    it("should return true if there are comments in file.", async () => {
      assayCacheStub.getFromCache.resolves({
        "test-guid": {
          "test-version": {
            "test-filepath": {
              "#L1": {
                uri: vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version/test-filepath"
                ),
              },
            },
          },
        },
      });
      directoryControllerStub.splitUri.resolves({
        guid: "test-guid",
        version: "test-version",
        filepath: "test-filepath",
      } as any);

      const result = await commentCacheController.fileHasComment(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );

      expect(result).to.be.true;
    });
  });
});
