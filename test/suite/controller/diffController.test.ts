import { expect } from "chai";
import * as child_process from "child_process";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { openInDiffTool } from "../../../src/controller/diffController";
import * as diffTool from "../../../src/views/diffView";

describe("launchDiff.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("openInDiffTool()", () => {
    it("should return undefined if no diff command is provided.", async () => {
      const getDiffCommandStub = sinon.stub(diffTool, "getDiffCommand");
      getDiffCommandStub.resolves(undefined);

      const result = await openInDiffTool([
        vscode.Uri.parse("file:///path/to/file1"),
        vscode.Uri.parse("file:///path/to/file2"),
      ]);
      expect(result).to.be.undefined;
    });

    it("should return true if child process runs.", async () => {
      const getDiffCommandStub = sinon.stub(diffTool, "getDiffCommand");
      getDiffCommandStub.resolves("diff");

      const spawnStub = sinon.stub(child_process, "spawn");
      const fakeChildProcess = {
        on: sinon.stub(),
      } as unknown as child_process.ChildProcess;
      spawnStub.returns(fakeChildProcess);

      const result = await openInDiffTool([
        vscode.Uri.parse("file:///path/to/file1"),
        vscode.Uri.parse("file:///path/to/file2"),
      ]);
      expect(result).to.be.true;
    });
  });
});

import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { setDiffCommand, getDiffCommand } from "../../../src/views/diffView";

describe("diffTool.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("setDiffCommand()", () => {
    it("should return undefined if no input is provided.", async () => {
      const config = vscode.workspace.getConfiguration("assay");
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.resolves(undefined);
      const result = await setDiffCommand(config);
      expect(result).to.be.undefined;
    });

    it("should return the input and update the config if input is provided.", async () => {
      const configStub = sinon.stub(vscode.workspace, "getConfiguration");
      const config = {
        update: sinon.stub(),
        get: sinon.stub(),
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
      };
      configStub.resolves(config);

      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.resolves("diff -rq");

      const result = await setDiffCommand(config);

      expect(result).to.equal("diff -rq");
      expect(config.update.calledOnce).to.be.true;
    });
  });

  describe("getDiffCommand()", () => {
    it("should return the diff command from the config if it exists.", async () => {
      const configStub = sinon.stub(vscode.workspace, "getConfiguration");
      const config = {
        update: sinon.stub(),
        get: sinon.stub(),
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
      };
      configStub.returns(config);
      config.get.returns("diff -rq");

      const result = await getDiffCommand();
      expect(result).to.equal("diff -rq");
      expect(config.get.calledOnce).to.be.true;
    });
  });
});
