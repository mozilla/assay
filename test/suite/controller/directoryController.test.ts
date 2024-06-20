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

  describe("getRootFolderPath()", async () => {
    it("should return the folder that is already set.", async () => {
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

        const directoryController = new DirectoryController(assayConfig, fileConfig);

        const existsSyncStub = sinon.stub(fs, "existsSync");
        existsSyncStub.returns(true);

        const result = await directoryController.getRootFolderPath();
        expect(result).to.equal("/test");
    });

    it("should throw an error if the folder is not set.", async () => {
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

        const directoryController = new DirectoryController(assayConfig, fileConfig);

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

        const directoryController = new DirectoryController(assayConfig, fileConfig);

        const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
        const uri = vscode.Uri.file("test");
        showOpenDialogStub.resolves([uri]);

        const result = await directoryController.getRootFolderPath();
        expect(result).to.equal("/test");
    });
  });


  describe("handleRootConfigurationChange()", async () => {

    const assayConfig = {
        update: sinon.stub(),
        get: () => {
            return "/root-folder";
        },
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
    };

    const fileConfig = {
        update: sinon.stub(),
        get: () => {
            return ["untouched-folder", "/old-folder/**"];
          },
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
    };

    const directoryController = new DirectoryController(assayConfig, fileConfig);
    const updateStub = sinon.stub();

    directoryController["setCachedRootFolder"]("/old-folder");
    const event = {affectsConfiguration: () => true} as vscode.ConfigurationChangeEvent;
    await directoryController.handleRootConfigurationChange(event);

    // assert old one was removed
    expect(updateStub.calledWith("readonlyInclude",
    { "untouched-folder": true, '/root-folder/**': true },
    vscode.ConfigurationTarget.Global));

  });
});
