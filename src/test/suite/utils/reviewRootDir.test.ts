import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  storeRootFolderSetting,
  getRootFolderPath,
  selectRootFolder,
} from "../../../amo/utils/reviewRootDir";

describe("reviewRootDir.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getRootFolderPath", async () => {
    it("should return the folder that is already set", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return "/test";
        },
      } as any);

      const stub2 = sinon.stub(fs, "existsSync");
      stub2.returns(true);

      const result = await getRootFolderPath();
      expect(result).to.equal("/test");
    });

    it("should throw an error if the folder is not set", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return undefined;
        },
      } as any);

      const stub2 = sinon.stub(vscode.window, "showOpenDialog");
      stub2.resolves(undefined);

      try {
        await getRootFolderPath();
        expect.fail("No error thrown");
      } catch (err: any) {
        expect(err.message).to.equal("No root folder selected");
      }
    });

    it("should return the new folder if the old one doesn't exist", async () => {
      const stub = sinon.stub(vscode.workspace, "getConfiguration");
      stub.returns({
        get: () => {
          return undefined;
        },
        update: () => {
          return undefined;
        },
      } as any);

      const stub2 = sinon.stub(vscode.window, "showOpenDialog");
      const uri = vscode.Uri.file("test");
      stub2.resolves([uri]);

      const result = await getRootFolderPath();
      expect(result).to.equal("/test");
    });
  });

  describe("selectRootFolder", async () => {
    it("should return undefined if no folder is chosen", async () => {
      // stub showOpenDialog to return undefined
      const stub = sinon.stub(vscode.window, "showOpenDialog");
      stub.resolves(undefined);

      const result = await selectRootFolder();
      expect(result).to.be.undefined;
    });

    it("should return the chosen folder", async () => {
      // stub showOpenDialog to return a folder
      const stub = sinon.stub(vscode.window, "showOpenDialog");
      const uri = vscode.Uri.file("test");
      stub.resolves([uri]);

      const result = await selectRootFolder();
      expect(result).to.equal("/test");
    });
  });
});
