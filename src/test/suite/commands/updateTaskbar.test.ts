import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { updateTaskbar } from "../../../amo/commands/updateTaskbar";

describe("updateTaskbar.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  const guid = "emailguid@guid.com";

  const fakeActiveEditor = {
    document: {
      uri: {
        fsPath: "/test",
      },
    },
  };

  const fakeActiveEditor2 = {
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

  describe("updateTaskbar", () => {
    it("should return undefined if there is no activeTextEditor", async () => {
      // by default, vscode.window.activeTextEditor is undefined
      expect(await updateTaskbar("")).to.be.undefined;
    });

    it("should throw error if the folder is not in the root", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return "/test";
        },
      } as any);

      const stub2 = sinon.stub();
      stub2.returns(fakeActiveEditor2);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub2 as any);

      const stub3 = sinon.stub(fs, "existsSync");
      stub3.returns(true);

      try {
        await updateTaskbar("");
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("File is not in the root folder");
      }
    });

    it("should throw an error if there is no guid in the path", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return "/test";
        },
      } as any);

      const stub2 = sinon.stub();
      stub2.returns(fakeActiveEditor);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub2 as any);

      const stub3 = sinon.stub(fs, "existsSync");
      stub3.returns(true);

      try {
        await updateTaskbar("");
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("No guid found");
      }
    });

    it("should return true if the taskbar is updated", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return "/root";
        },
      } as any);

      const stub2 = sinon.stub();
      stub2.returns(fakeActiveEditor2);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub2 as any);

      const stub3 = sinon.stub(fs, "existsSync");
      stub3.returns(true);

      const stub4 = sinon.stub();
      stub4.returns(fakeWorkspaceFolder);
      sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub4 as any);

      const stub5 = sinon.stub(fs.promises, "readFile");
      stub5.resolves(`{"reviewUrl":"test"}`);

      const result = await updateTaskbar("");
      expect(result).to.be.true;
    });
  });
});
