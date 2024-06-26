import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AddonCacheController } from "../../../src/controller/addonCacheController";
import { CredentialController } from "../../../src/controller/credentialController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { LintController } from "../../../src/controller/lintController";
import { NotificationView } from "../../../src/views/notificationView";
let credentialControllerStub: sinon.SinonStubbedInstance<CredentialController>,
addonCacheControllerStub: sinon.SinonStubbedInstance<AddonCacheController>,
directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>;
let lintController: LintController;
let collection: vscode.DiagnosticCollection;

describe("lintController.ts", async () => {

    beforeEach(() => {

        const workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders");
        workspaceFoldersStub.value([
            {
            uri: "rootUri",
            },
        ]);

         collection = vscode.languages.createDiagnosticCollection("test-linter");

        credentialControllerStub = sinon.createStubInstance(CredentialController);
        credentialControllerStub.makeAuthHeader.resolves({ Authorization: "test" });

        addonCacheControllerStub = sinon.createStubInstance(AddonCacheController);
        addonCacheControllerStub.getAddonFromCache.resolves({id: "id", file_ids: {"version": "fileID"}});

        directoryControllerStub = sinon.createStubInstance(DirectoryController);
        directoryControllerStub.readFile.resolves(new Uint8Array());
        directoryControllerStub.splitUri.resolves({
            rootFolder: "",
            versionPath: "version",
            fullPath: "",
            relativePath: "",
            guid: "",
            version: "version",
            filepath: ""
        });

        lintController = new LintController(collection, credentialControllerStub, addonCacheControllerStub, directoryControllerStub);

    });

  afterEach(async () => {
    sinon.restore();
  });

  describe("lintWorkspace()", () => {
    it("should correctly create a set Diagnostic[] from lint results and set it in the diagnosticCollection.", async () => {

        const data = {
            success: true,
            messages: [{
            type: "error",
            code: "error code",
            message: "error message",
            description: "description",
            file: "file1.js",
            line: 1
        },
        {
            type: "error",
            code: "error code 2",
            message: "error message 2",
            description: "description 2",
            file: "file1.js",
            line: 1
        },
        {
            type: "notice",
            code: "notice code",
            message: "notice message",
            description: "description",
            file: "file2.js",
            line: 2
        },
        {
            type: "warning",
            code: "warning code",
            message: "warning message",
            description: "description",
            file: "file3.js",
            line: 3
        }
        ]};
        const fetchStub = sinon.stub(global, "fetch");
        fetchStub.resolves({
            json: () => ({validation: data}),
            ok: true
        } as unknown as Response);

        await lintController.lintWorkspace();

        const errorUri = vscode.Uri.parse("version/file1.js");
        expect(collection.has(errorUri)).to.be.equal(true);
        expect(collection.get(errorUri)?.length).to.be.equal(2);
        const errorDiagnostic = collection.get(errorUri)?.at(0);
        const errorDiagnosticTwo = collection.get(errorUri)?.at(1);

        const errorStart = new vscode.Position(0, 0);
        const errorEnd = new vscode.Position(0, 0);
        const errorRange = new vscode.Range(errorStart, errorEnd);

        expect(errorDiagnostic?.range).to.deep.equal(errorRange);
        expect(errorDiagnostic?.severity).to.be.equal(vscode.DiagnosticSeverity.Error);
        expect(errorDiagnostic?.message).to.be.equal("error message");
        expect(errorDiagnostic?.code).to.be.equal("error code");

        expect(errorDiagnosticTwo?.range).to.deep.equal(errorRange);
        expect(errorDiagnosticTwo?.severity).to.be.equal(vscode.DiagnosticSeverity.Error);
        expect(errorDiagnosticTwo?.message).to.be.equal("error message 2");
        expect(errorDiagnosticTwo?.code).to.be.equal("error code 2");

        const noticeUri = vscode.Uri.parse("version/file2.js");
        expect(collection.has(noticeUri)).to.be.equal(true);
        expect(collection.get(noticeUri)?.length).to.be.equal(1);
        const noticeDiagnostic = collection.get(noticeUri)?.at(0);

        const noticeStart = new vscode.Position(1, 0);
        const noticeEnd = new vscode.Position(1, 0);
        const noticeRange = new vscode.Range(noticeStart, noticeEnd);

        expect(noticeDiagnostic?.range).to.deep.equal(noticeRange);
        expect(noticeDiagnostic?.severity).to.be.equal(vscode.DiagnosticSeverity.Information);
        expect(noticeDiagnostic?.message).to.be.equal("notice message");
        expect(noticeDiagnostic?.code).to.be.equal("notice code");

        const warningUri = vscode.Uri.parse("version/file3.js");
        expect(collection.has(warningUri)).to.be.equal(true);
        expect(collection.get(warningUri)?.length).to.be.equal(1);
        const warningDiagnostic = collection.get(warningUri)?.at(0);

        const warningStart = new vscode.Position(2, 0);
        const warningEnd = new vscode.Position(2, 0);
        const warningRange = new vscode.Range(warningStart, warningEnd);

        expect(warningDiagnostic?.range).to.deep.equal(warningRange);
        expect(warningDiagnostic?.severity).to.be.equal(vscode.DiagnosticSeverity.Warning);
        expect(warningDiagnostic?.message).to.be.equal("warning message");
        expect(warningDiagnostic?.code).to.be.equal("warning code");


      });

    it("should show an error message when fetch fails with a 404", async () => {
        const showErrorMessageStub = sinon.stub(NotificationView, "showErrorMessage");

        const data = {
            success: true,
            messages: []};
        const fetchStub = sinon.stub(global, "fetch");
        fetchStub.resolves({
            json: () => ({validation: data}),
            ok: false,
            status: 404
        } as unknown as Response);

        await lintController.lintWorkspace();
        
        expect(showErrorMessageStub.called).to.be.true;
    });
  });

});

