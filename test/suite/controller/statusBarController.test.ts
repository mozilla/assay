import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AddonCacheController } from "../../../src/controller/addonCacheController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { StatusBarController } from "../../../src/controller/statusBarController";

const guid = "emailguid@guid.com";

const fakeActiveEditor = {
  document: {
    uri: {
      fsPath: "/test",
    },
  },
};

const fakeActiveEditorWithGuid = {
  document: {
    uri: {
      fsPath: `/root/${guid}/version/test.js`,
    },
  },
};

const fakeWorkspaceFolder = {
  uri: {
    fsPath: "/root",
  },
};

let addonCacheControllerStub: sinon.SinonStubbedInstance<AddonCacheController>,
  directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>;
let statusBarController: StatusBarController;

describe("statusBarController.ts", async () => {
  beforeEach(() => {
    addonCacheControllerStub = sinon.createStubInstance(AddonCacheController);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    statusBarController = new StatusBarController(
      addonCacheControllerStub,
      directoryControllerStub
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("updateStatusBar()", () => {
    it("should return false if there is no activeTextEditor.", async () => {
      sinon.stub(vscode.window, "activeTextEditor").value(undefined);
      expect(await statusBarController.updateStatusBar()).to.be.false;
    });

    it("should throw error if the folder is not in the root.", async () => {
      directoryControllerStub.getRootFolderPath.resolves("/different-root");

      const activeTextEditorStub = sinon.stub();
      activeTextEditorStub.returns(fakeActiveEditorWithGuid);
      sinon.replaceGetter(
        vscode.window,
        "activeTextEditor",
        activeTextEditorStub as any
      );

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.returns(true);

      try {
        await statusBarController.updateStatusBar();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder.");
      }
    });

    it("should throw an error if there is no guid in the path.", async () => {
      directoryControllerStub.getRootFolderPath.resolves("/test");

      const activeTextEditorStub = sinon.stub();
      activeTextEditorStub.returns(fakeActiveEditor);
      sinon.replaceGetter(
        vscode.window,
        "activeTextEditor",
        activeTextEditorStub as any
      );

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.returns(true);

      try {
        await statusBarController.updateStatusBar();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("No guid found.");
      }
    });

    it("should return true if the taskbar is updated.", async () => {
      directoryControllerStub.getRootFolderPath.resolves("/root");

      const activeTextEditorStub = sinon.stub();
      activeTextEditorStub.returns(fakeActiveEditorWithGuid);
      sinon.replaceGetter(
        vscode.window,
        "activeTextEditor",
        activeTextEditorStub as any
      );

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.returns(true);

      const workspaceFoldersStub = sinon.stub();
      workspaceFoldersStub.returns(fakeWorkspaceFolder);
      sinon.replaceGetter(
        vscode.workspace,
        "workspaceFolders",
        workspaceFoldersStub as any
      );

      const result = await statusBarController.updateStatusBar();
      expect(addonCacheControllerStub.getAddonFromCache.called).to.be.true;
      expect(result).to.be.true;
    });
  });
});
