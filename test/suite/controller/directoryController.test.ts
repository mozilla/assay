import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  getRootFolderPath,
  handleRootConfigurationChange,
  selectRootFolder,
  setCachedRootFolder,
} from "../../../src/controller/directoryController";

describe("reviewRootDir.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getRootFolderPath()", async () => {
    it("should return the folder that is already set.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return "/test";
        },
      } as any);

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.returns(true);

      const result = await getRootFolderPath();
      expect(result).to.equal("/test");
    });

    it("should throw an error if the folder is not set.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return undefined;
        },
      } as any);

      const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
      showOpenDialogStub.resolves(undefined);

      try {
        await getRootFolderPath();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("No root folder selected");
      }
    });

    it("should return the new folder if the old one doesn't exist.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return undefined;
        },
        update: () => {
          return undefined;
        },
      } as any);

      const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
      const uri = vscode.Uri.file("test");
      showOpenDialogStub.resolves([uri]);

      const result = await getRootFolderPath();
      expect(result).to.equal("/test");
    });
  });

  describe("selectRootFolder()", async () => {
    it("should return undefined if no folder is chosen.", async () => {
      const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
      showOpenDialogStub.resolves(undefined);

      const result = await selectRootFolder();
      expect(result).to.be.undefined;
    });

    it("should return the chosen folder.", async () => {
      const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
      const uri = vscode.Uri.file("test");
      showOpenDialogStub.resolves([uri]);

      const result = await selectRootFolder();
      expect(result).to.equal("/test");
    });
  });

  describe("handleRootConfigurationChange()", async () => {


    const updateStub = sinon.stub();

    const getConfigurationStub = sinon.stub(
      vscode.workspace,
      "getConfiguration"
    );
    getConfigurationStub.onFirstCall().returns({
      get: () => {
        return "/root-folder";
      },
    } as any);
    getConfigurationStub.onSecondCall().returns({
      get: () => {
        return ["untouched-folder", "/old-folder/**"];
      },
      update: updateStub
    } as any);

    setCachedRootFolder("/old-folder");
    const event = {affectsConfiguration: () => true} as vscode.ConfigurationChangeEvent;
    await handleRootConfigurationChange(event);

    // assert old one was removed
    expect(updateStub.calledWith("readonlyInclude",
    { "untouched-folder": true, '/root-folder/**': true },
    vscode.ConfigurationTarget.Global));

  });
});
