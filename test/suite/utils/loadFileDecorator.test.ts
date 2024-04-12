import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as constants from "../../../src/config/globals";
import * as cacheFunctions from "../../../src/utils/addonCache";
import { loadFileDecorator } from "../../../src/utils/loadFileDecorator";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("loadFileDecorator.ts", async () => {
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

  describe("loadFileDecorator()", async () => {
    it("should return if there is no activeTextEditor", async () => {
      const result = await loadFileDecorator();
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
        await loadFileDecorator();
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

      const result = await loadFileDecorator();
      expect(result).to.be.undefined;
    });
  });
});