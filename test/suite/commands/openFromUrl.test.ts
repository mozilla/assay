import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as getAddonFunctions from "../../../src/commands/getAddon";
import { handleUri, openWorkspace } from "../../../src/commands/openFromUrl";
import * as globals from "../../../src/config/globals";
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

      const updateWorkspaceFoldersStub = sinon.stub(
        vscode.workspace,
        "updateWorkspaceFolders"
      );
      updateWorkspaceFoldersStub.resolves();

      const context = {
        globalState: {
          update: sinon.stub(),
        },
      };
      const getExtensionContextStub = sinon.stub(
        globals,
        "getExtensionContext"
      );
      getExtensionContextStub.returns(context as any);

      await handleUri(uri as any);
      expect(downloadAndExtractStub.called).to.be.true;
    });

    it("should not fail the stat check and not call downloadAndExtract()", async () => {
      const uri = {
        path: "/review/test-guid/test-version",
      };
      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves("test-root-folder-path");

      const fsStatStub = sinon.stub(fs.promises, "stat");
      fsStatStub.resolves();

      const downloadAndExtractStub = sinon.stub(
        getAddonFunctions,
        "downloadAndExtract"
      );

      const showTextDocumentStub = sinon.stub(
        vscode.window,
        "showTextDocument"
      );
      showTextDocumentStub.resolves();

      const updateWorkspaceFoldersStub = sinon.stub(
        vscode.workspace,
        "updateWorkspaceFolders"
      );
      updateWorkspaceFoldersStub.resolves();

      const context = {
        globalState: {
          update: sinon.stub(),
        },
      };
      const getExtensionContextStub = sinon.stub(
        globals,
        "getExtensionContext"
      );
      getExtensionContextStub.returns(context as any);

      await handleUri(uri as any);
      expect(downloadAndExtractStub.called).to.be.false;
    });
  });

  describe("openWorkspace()", async () => {
    it("should open the manifest if the workspace is already open", async () => {
      const manifestUri = vscode.Uri.parse("test-manifest-uri");
      const executeCommandStub = sinon.stub(
        vscode.commands,
        "executeCommand"
      );
      executeCommandStub.resolves();

      const rootUri = vscode.Uri.parse("test-root-uri");
      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves(rootUri.fsPath);

      const workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders");
      workspaceFoldersStub.value([
        {
          uri: rootUri,
        },
      ]);

      const showTextDocumentStub = sinon.stub(
        vscode.window,
        "showTextDocument"
      );
      showTextDocumentStub.resolves();

      await openWorkspace(manifestUri.fsPath);
      expect(executeCommandStub.called).to.be.true;
      expect(showTextDocumentStub.called).to.be.true;
    });
  });
});
