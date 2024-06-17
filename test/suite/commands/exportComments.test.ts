import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  compileComments,
  exportComments,
  exportVersionComments
} from "../../../src/controller/exportController";
import * as addonCache from "../../../src/model/cache";
import * as getdeleteComments from "../../../src/views/exportView";
import * as reviewRootDir from "../../../src/controller/directoryController";

describe("exportComments.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    sinon.stub(reviewRootDir, "getRootFolderPath").resolves("/test-root");
  });

  describe("compileComments()", () => {
    it("should return the compiled comments.", async () => {
      sinon.stub(addonCache, "getFromCache").resolves({
        "/test-filepath": {
          "#L1": {
            "body": "test-comment"
          },
        },
      });

      const result = await compileComments("guid", "version");
      expect(result).to.contain("test-filepath");
      expect(result).to.contain("#L2");
      expect(result).to.contain("test-comment");
    });
  });

  describe("exportComments()", () => {
    it("should show an information message.", async () => {

      const preferenceStub = sinon.stub(getdeleteComments, "default");
      preferenceStub.resolves(false);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );
      await exportComments("test-compiled-comments", vscode.Uri.file("guid"));
      vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      expect(showInformationMessageStub.called).to.be.true;
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
        await exportVersionComments(vscode.Uri.file("/not-root"));
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
        await exportVersionComments(vscode.Uri.file("/test-root"));
      } catch (err: any) {
        expect(err.message).to.equal("No guid or version found");
      }
    });
  });
});
