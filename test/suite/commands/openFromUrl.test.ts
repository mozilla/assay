import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as getAddonFunctions from "../../../src/commands/getAddon";
import { handleReviewUrl, handleUri } from "../../../src/commands/openFromUrl";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("openFromUrl.ts", async () => {
  afterEach(async () => {
    sinon.restore();
  });

  describe("handleUri()", async () => {
    it("should do nothing if the action is not review", async () => {
      const uri = {
        path: "/test-action/test-guid/test-version",
      };
      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      await handleUri(uri as any);
      expect(getRootFolderPathStub.called).to.be.false;
    });

    it("should fail the stat check and call downloadAndExtract() if the manifest does not exist", async () => {
      const uri = {
        path: "/review/test-guid/test-version",
      };
      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves("test-root-folder-path");

      const fsStatStub = sinon.stub(fs.promises, "stat");
      fsStatStub.rejects();

      const downloadAndExtractStub = sinon.stub(
        getAddonFunctions,
        "downloadAndExtract"
      );
      downloadAndExtractStub.resolves();

      const showTextDocumentStub = sinon.stub(
        vscode.window,
        "showTextDocument"
      );
      showTextDocumentStub.resolves();

      await handleUri(uri as any);
      expect(downloadAndExtractStub.called).to.be.true;
      expect(showTextDocumentStub.called).to.be.true;
    });
  });
});
