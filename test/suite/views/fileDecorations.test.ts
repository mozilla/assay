import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as addonCache from "../../../src/utils/addonCache";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";
import {
  fileHasComment,
  CustomFileDecorationProvider,
} from "../../../src/views/fileDecorations";

describe("fileDecorations.ts", async () => {
  beforeEach(() => {
    const getRootFolderPathStub = sinon.stub(
      reviewRootDir,
      "getRootFolderPath"
    );
    getRootFolderPathStub.resolves("test-root-folder-path/");
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("fileHasComment()", async () => {
    it("should return false if there are no comments", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      getFromCacheStub.resolves(undefined);

      const result = await fileHasComment(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );
      expect(result).to.be.false;
      expect(
        getFromCacheStub.calledWith("test-guid", [
          "test-version",
          "test-filepath",
        ])
      ).to.be.true;
    });

    it("should return true if there are comments", async () => {
        const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
        getFromCacheStub.resolves({ "test-key": "test-value" });

        const result = await fileHasComment(
          vscode.Uri.file(
            "test-root-folder-path/test-guid/test-version/test-filepath"
          )
        );

        expect(result).to.be.true;
        expect(
          getFromCacheStub.calledWith("test-guid", [
            "test-version",
            "test-filepath",
          ])
        ).to.be.true;
    });
  });
});
