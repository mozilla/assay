import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  compileComments,
  exportComments,
  exportCommentsFromFile,
  exportCommentsFromFolderPath,
  getExportHTML,
} from "../../../src/commands/exportComments";
import * as addonCache from "../../../src/utils/addonCache";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("exportComments.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    sinon.stub(reviewRootDir, "getRootFolderPath").resolves("/test-root");
  });

  describe("getExportHTML()", () => {
    it("should return the HTML", async () => {
      const result = await getExportHTML("test-compiled-comments");
      expect(result).to.contain("test-compiled-comments");
    });
  });

  describe("compileComments()", () => {
    it("should return the compiled comments", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache").resolves({
        "/test-filepath": {
          "1": "test-comment",
        },
      });

      const result = await compileComments("guid", "version");
      expect(result).to.contain("test-filepath");
      expect(result).to.contain("1");
      expect(result).to.contain("test-comment");
    });
  });

  describe("exportComments()", () => {
    it("should show an information message", async () => {
      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );
      await exportComments("test-compiled-comments");
      expect(showInformationMessageStub.called).to.be.true;
    });
  });

  describe("exportCommentsFromFile()", () => {
    it("should return if there is no active text editor", async () => {
      const result = await exportCommentsFromFile();
      expect(result).to.be.undefined;
    });

    it("should throw an error if the file is not in the root folder", async () => {
      const editor = {
        document: {
          uri: {
            fsPath: "/test-filepath",
          },
        },
      } as vscode.TextEditor;
      sinon.stub(vscode.window, "activeTextEditor").get(() => editor);

      try {
        await exportCommentsFromFile();
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid or version", async () => {
      const editor = {
        document: {
          uri: {
            fsPath: "/test-root",
          },
        },
      } as vscode.TextEditor;
      sinon.stub(vscode.window, "activeTextEditor").get(() => editor);

      try {
        await exportCommentsFromFile();
      } catch (err: any) {
        expect(err.message).to.equal("No guid or version found");
      }
    });
  });

  describe("exportCommentsFromFolder()", () => {
    it("should throw an error if the file is not in the root folder", async () => {
      const fullPath = vscode.Uri.file("/test-filepath");
      try {
        await exportCommentsFromFolderPath(fullPath);
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid or version", async () => {
      const fullPath = vscode.Uri.file("/test-root");
      try {
        await exportCommentsFromFolderPath(fullPath);
      } catch (err: any) {
        expect(err.message).to.equal("No guid or version found");
      }
    });
  });
});
