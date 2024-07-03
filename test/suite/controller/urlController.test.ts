import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AddonController } from "../../../src/controller/addonController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { UrlController } from "../../../src/controller/urlController";
import { TypeOption } from "../../../src/types";

const context = {
    globalState: {
      update: sinon.stub(),
    },
} as any;

let addonControllerStub: sinon.SinonStubbedInstance<AddonController>,
directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>;

let urlController: UrlController;


describe("urlController.ts", async () => {

    beforeEach(() => {
        addonControllerStub = sinon.createStubInstance(AddonController);
        directoryControllerStub = sinon.createStubInstance(DirectoryController);
        urlController = new UrlController(context, addonControllerStub, directoryControllerStub);
    });

  afterEach(async () => {
    sinon.restore();
  });

  describe("handleUri()", async () => {
    it("should do nothing if the action is not review.", async () => {
      const uri = {
        path: "/test-action/test-guid/test-version",
      };

      await urlController.handleUri(uri as any);
      expect(directoryControllerStub.getRootFolderPath.called).to.be.false;
    });

    it("should fail the stat check and call downloadAndExtract() if the manifest does not exist.", async () => {

      const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
      executeCommandStub.resolves();

      const uri = {
        path: "/review/test-guid/test-version",
      };
      
      directoryControllerStub.getRootFolderPath.resolves("test-root-folder-path");
      addonControllerStub.downloadAndExtract.resolves();

      const fsStatStub = sinon.stub(fs.promises, "stat");
      fsStatStub.rejects();

      const showTextDocumentStub = sinon.stub(
        vscode.window,
        "showTextDocument"
      );
      showTextDocumentStub.resolves();

      await urlController.handleUri(uri as any);
      expect(addonControllerStub.downloadAndExtract.called).to.be.true;
    });

    it("should not fail the stat check and not call downloadAndExtract().", async () => {

      const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
      executeCommandStub.resolves();

      const uri = {
        path: "/review/test-guid/test-version",
      };
      directoryControllerStub.getRootFolderPath.resolves("test-root-folder-path");

      const fsStatStub = sinon.stub(fs.promises, "stat");
      fsStatStub.resolves();

      const showTextDocumentStub = sinon.stub(
        vscode.window,
        "showTextDocument"
      );
      showTextDocumentStub.resolves();


      await urlController.handleUri(uri as any);
      expect(addonControllerStub.downloadAndExtract.called).to.be.false;
    });
  });

  describe("openWorkspace()", async () => {
    it("should open the manifest if the workspace is already open.", async () => {
      
      const executeCommandStub = sinon.stub(
        vscode.commands,
        "executeCommand"
      );
      executeCommandStub.resolves();

      const manifestUri = vscode.Uri.parse("test-manifest-uri");
      const rootUri = vscode.Uri.parse("test-root-uri");
      directoryControllerStub.getRootFolderPath.resolves(rootUri.fsPath);

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

      await urlController["openWorkspace"](TypeOption.Xpi, manifestUri.fsPath);
      expect(executeCommandStub.calledOnceWith("vscode.openFolder")).to.be.true;
    });
  });

  describe("getAddonByUrl", async () => {
    it("should receive a result from downloadAndExtract and correctly call openWorkspace.", async () => {

      addonControllerStub.downloadAndExtract.resolves({ workspaceFolder: "workspace", type: TypeOption.Xpi, guid: "guid", version: "version" });
      const openWorkspaceStub = sinon.stub(urlController, <any>"openWorkspace");
      await urlController.getAddonByUrl();
      expect(openWorkspaceStub.calledWith('workspace/guid/version'));
    });

  });

  describe("revealFile()", () => {
    
    it("should reveal the document located at URI.", async () => {
        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        const URI = vscode.Uri.parse("index.html");

        await urlController.revealFile(URI, "#L1");

        expect(showTextDocumentStub.calledOnce).to.be.true;
        expect(showTextDocumentStub.firstCall.args[0]).to.deep.equal(URI);
    });

    it("should reveal the document located at URI and correctly highlight and reveal the desired range", async () => {
        const range = new vscode.Range(new vscode.Position(25, 0), new vscode.Position(25, 0));
        const revealRangeStub = sinon.stub();

        const fakeEditor = {
            revealRange: revealRangeStub,
            selections: [],
        } as unknown as vscode.TextEditor;

        const URI = vscode.Uri.file("index.html");
        const lineNumber = "#L25";

        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        showTextDocumentStub.resolves(fakeEditor);

        await urlController.revealFile(URI, lineNumber);

        expect(revealRangeStub.calledOnce).to.be.true;
        expect(revealRangeStub.firstCall.args[0]).to.deep.equal(range);
    });
  });
});
