import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
DirectoryController
} from "../../../src/controller/directoryController";

describe("directoryController.ts", async () => {

  afterEach(() => {
    sinon.restore();
  });

  describe("getLineFromFile()", async () => {

    it("should fetch the desired line from the given line number and uri", async () => {
        const uri = vscode.Uri.file('/test/path');
        const buffer = Buffer.from("Line 0\nLine 1\nLine 2");
        const directoryController = new DirectoryController();
        const readFileStub = sinon.stub(directoryController, 'readFile').resolves(buffer);
        const result = await directoryController.getLineFromFile(uri, 2);
        expect(readFileStub.called).to.be.true;
        expect(result).to.equal("Line 2");
    });
  });

  describe("getRootFolderPath()", async () => {
    it("should return the folder that is already set.", async () => {
        const configStub = sinon.stub(vscode.workspace, "getConfiguration");
        const assayConfig = {
            update: sinon.stub(),
            get: () => {
                return "/test";
            },
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };

        const fileConfig = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };

        configStub.withArgs("assay").returns(assayConfig);
    configStub.withArgs("files").returns(fileConfig);

        const directoryController = new DirectoryController();

        const existsSyncStub = sinon.stub(fs, "existsSync");
        existsSyncStub.returns(true);

        const result = await directoryController.getRootFolderPath();
        expect(result).to.equal("/test");
    });

    it("should throw an error if the folder is not set.", async () => {
        const configStub = sinon.stub(vscode.workspace, "getConfiguration");
        sinon.stub(vscode.window, 'showInformationMessage').resolves();

        const assayConfig = {
            update: sinon.stub(),
            get: () => {
                return "/test";
            },
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };

        const fileConfig = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };

        configStub.withArgs("assay").returns(assayConfig);
    configStub.withArgs("files").returns(fileConfig);

        const directoryController = new DirectoryController();

        const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
        showOpenDialogStub.resolves(undefined);

        try {
            await directoryController.getRootFolderPath();
            expect.fail("No error thrown");
        } catch (err: any) {
            expect(err.message).to.equal("No root folder selected");
        }
    });

    it("should return the new folder if the old one doesn't exist.", async () => {
        const configStub = sinon.stub(vscode.workspace, "getConfiguration");
        const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves();

        const assayConfig = {
            get: () => {
            return undefined;
            },
            update: () => {
            return undefined;
            },
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        } as any;

        const fileConfig = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };

        configStub.withArgs("assay").returns(assayConfig);
        configStub.withArgs("files").returns(fileConfig);

        const directoryController = new DirectoryController();

        const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
        const uri = vscode.Uri.file("test");
        showOpenDialogStub.resolves([uri]);

        const result = await directoryController.getRootFolderPath();
        expect(showInformationMessageStub.called).to.be.true;
        expect(result).to.equal("/test");
    });
  });

});
