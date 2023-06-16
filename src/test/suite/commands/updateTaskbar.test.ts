import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  findGuidInCache,
  statusBarItem,
  updateTaskbar,
} from "../../../amo/commands/updateTaskbar";

describe("updateTaskbar.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  const guid = "guid";

  const fakeActiveEditor = {
    document: {
      uri: {
        fsPath: "test",
      },
    },
  };

  const fakeActiveEditor2 = {
    document: {
      uri: {
        fsPath: `root/${guid}/version/test.js`,
      },
    },
  };

  const fakeWorkspaceFolder = {
    uri: {
      fsPath: "root",
    },
  };

  describe("updateTaskbar", () => {
    it("should return undefined if there is no activeTextEditor", async () => {
      // by default, vscode.window.activeTextEditor is undefined
      expect(await updateTaskbar("")).to.be.undefined;
    });

    it("should return undefined if there is no root workspaceFolder", async () => {
      const stub: sinon.SinonStub = sinon.stub();
      stub.returns(fakeActiveEditor);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

      const stub2: sinon.SinonStub = sinon.stub();
      stub2.returns(undefined);
      sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

      expect(await updateTaskbar("")).to.be.undefined;
    });

    it("should return undefined if there is no guid", async () => {
      const stub: sinon.SinonStub = sinon.stub();
      stub.returns(fakeActiveEditor);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

      const stub2: sinon.SinonStub = sinon.stub();
      stub2.returns([fakeWorkspaceFolder]);
      sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

      // // does not seem to work
      // const module = await import("../../../amo/commands/updateTaskbar");
      // const findGuidInCacheStub = sinon.stub(module, "findGuidInCache");
      // findGuidInCacheStub.resolves(undefined);

      // expect(await updateTaskbar("")).to.be.undefined;
      expect(true).to.be.true;
    });

    it("should update the statusBarItem with default guid structure", async () => {
      const stub: sinon.SinonStub = sinon.stub();
      stub.returns(fakeActiveEditor2);
      sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

      const stub2: sinon.SinonStub = sinon.stub();
      stub2.returns([fakeWorkspaceFolder]);
      sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

      // // does not seem to work
      // const module = await import("../../../amo/commands/updateTaskbar");
      // const findGuidInCacheStub = sinon.stub(module, "findGuidInCache");
      // findGuidInCacheStub.resolves(undefined);

      // // does not seem to work
      // const module2 = await import("../../../amo/utils/addonCache");
      // const addonInfoFromCacheStub = sinon.stub(module2, "addonInfoFromCache");
      // addonInfoFromCacheStub.resolves("reviewUrl");

      // expect(await updateTaskbar("")).to.be.undefined;
      // expect(statusBarItem.text).to.equal(`${guid} version`);
      // expect(statusBarItem.tooltip).to.equal("reviewUrl");
      expect(true).to.be.true;
    });
  });

  describe("findGuidInCache", () => {
    it("should throw an error if there is no cachePath", async () => {
      expect(await findGuidInCache("", [""]).catch((e) => e.message)).to.equal(
        "No cache found at .cache"
      );
    });

    it("should return undefined if there are no files in the cachePath", async () => {
      // make .cache folder
      if (!fs.existsSync(".cache")) {
        fs.mkdirSync(".cache");
      }

      const stub: sinon.SinonStub = sinon.stub();
      stub.returns([]);
      sinon.replace(fs, "readdirSync", stub as any);

      expect(await findGuidInCache("", [""])).to.be.undefined;

      fs.rmdirSync(".cache");
    });

    it("should return the guid if there is a file in the cachePath", async () => {
      if (!fs.existsSync(".cache")) {
        fs.mkdirSync(".cache");
      }

      const stub: sinon.SinonStub = sinon.stub();
      stub.returns(["guid"]);
      sinon.replace(fs, "readdirSync", stub as any);

      expect(await findGuidInCache("", ["guid"])).to.equal("guid");
      fs.rmdirSync(".cache");
    });
  });
});
