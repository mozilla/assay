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
