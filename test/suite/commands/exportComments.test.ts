import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  compileComments,
  exportComments
} from "../../../src/commands/exportComments";
import * as addonCache from "../../../src/utils/addonCache";
import * as getDeleteVersionComments from "../../../src/utils/getDeleteVersionComments";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("exportComments.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    sinon.stub(reviewRootDir, "getRootFolderPath").resolves("/test-root");
  });

  describe("compileComments()", () => {
    it("should return the compiled comments", async () => {
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
    it("should show an information message", async () => {

      const preferenceStub = sinon.stub(getDeleteVersionComments, "getDeleteVersionCommentsPreference");
      preferenceStub.resolves(false);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );
      await exportComments("test-compiled-comments", "guid", "version");
      vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      expect(showInformationMessageStub.called).to.be.true;
    });
  });
});
