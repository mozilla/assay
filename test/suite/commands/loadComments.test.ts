import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { loadFileComments } from "../../../src/commands/loadComments";
import * as constants from "../../../src/config/globals";
import * as cacheFunctions from "../../../src/utils/addonCache";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("loadComments.ts", async () => {
  beforeEach(() => {
    const getFileDecoratorStub = sinon.stub(
      constants,
      "getFileDecorator"
    );
    getFileDecoratorStub.returns({
      updateDecorations: sinon.stub(),
    } as any);
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("loadFileComments()", async () => {
    it("should return if there is no activeTextEditor", async () => {
      const result = await loadFileComments();
      expect(result).to.be.undefined;
    });

    it("should throw an error if the file is not in the root folder", async () => {
      const activeTextEditorStub = sinon.stub(
        vscode.window,
        "activeTextEditor"
      );
      activeTextEditorStub.value({
        document: {
          uri: {
            fsPath: "test-fs-path",
          },
        },
      });

      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves("test-root-folder-path");

      try {
        await loadFileComments();
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should return if there are no comments", async () => {
      const activeTextEditorStub = sinon.stub(
        vscode.window,
        "activeTextEditor"
      );
      activeTextEditorStub.value({
        document: {
          uri: {
            fsPath:
              "test-root-folder-path/test-guid/test-version/test-filepath",
          },
        },
        setDecorations: sinon.stub(),
      });

      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves("test-root-folder-path");

      const getFromCacheStub = sinon.stub(cacheFunctions, "getFromCache");
      getFromCacheStub.resolves(undefined);

      const result = await loadFileComments();
      expect(result).to.be.undefined;
    });

    it("should set the decorations on each line number", async () => {
        const setDecorationsStub = sinon.stub();
        const activeTextEditorStub = sinon.stub(
            vscode.window,
            "activeTextEditor"
        );
        activeTextEditorStub.value({
            document: {
            uri: {
                fsPath:
                "test-root-folder-path/test-guid/test-version/test-filepath",
            },
            },
            setDecorations: setDecorationsStub,
        });
    
        const getRootFolderPathStub = sinon.stub(
            reviewRootDir,
            "getRootFolderPath"
        );
        getRootFolderPathStub.resolves("test-root-folder-path");
    
        const getFromCacheStub = sinon.stub(cacheFunctions, "getFromCache");
        getFromCacheStub.resolves({
            "test-lineNumber": "test-comment",
        });
    
        await loadFileComments();
    
        expect(setDecorationsStub.calledOnce).to.be.true;
        expect(setDecorationsStub.args[0][1].length).to.equal(1);
    });
  });
});
