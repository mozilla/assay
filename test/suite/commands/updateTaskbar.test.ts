import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { updateTaskbar } from "../../../src/controller/statusBarController";
import { setExtensionStoragePath } from "../../../src/config/globals";

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

describe("updateTaskbar.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("updateTaskbar()", () => {
    it("should return undefined if there is no activeTextEditor.", async () => {
      // by default, vscode.window.activeTextEditor is undefined
      expect(await updateTaskbar()).to.be.undefined;
    });

    it("should throw error if the folder is not in the root.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return "/test";
        },
      } as any);

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
        await updateTaskbar();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid in the path.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return "/test";
        },
      } as any);

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
        await updateTaskbar();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("No guid found");
      }
    });

    it("should return true if the taskbar is updated.", async () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.returns({
        get: () => {
          return "/root";
        },
      } as any);

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

      const readFileStub = sinon.stub(fs.promises, "readFile");
      readFileStub.resolves(`{"reviewUrl":"test"}`);

      setExtensionStoragePath("");

      const result = await updateTaskbar();
      expect(result).to.be.true;
    });
  });
});
