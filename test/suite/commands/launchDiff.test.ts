import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { openInDiffTool } from "../../../src/commands/launchDiff";
import * as diffTool from "../../../src/utils/diffTool";
import exp = require("constants");

describe("launchDiff.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("openInDiffTool()", () => {
    it("should return undefined if no diff command is provided", async () => {
      const getDiffCommandStub = sinon.stub(diffTool, "getDiffCommand");
      getDiffCommandStub.resolves(undefined);

      const result = await openInDiffTool([
        vscode.Uri.parse("file:///path/to/file1"),
        vscode.Uri.parse("file:///path/to/file2"),
      ]);
      expect(result).to.be.undefined;
    });

    it("should launch a terminal with the diff command and file paths", async () => {
      const getDiffCommandStub = sinon.stub(diffTool, "getDiffCommand");
      getDiffCommandStub.resolves("diff -rq");

      // make and stub an entire fake terminal.
      const terminalStub = sinon.stub(vscode.window, "createTerminal");
      const fakeCreationOptions: vscode.TerminalOptions = {};
      const fakeTerminalState: vscode.TerminalState = {
        isInteractedWith: false,
      };
      const sendTextStub = sinon.stub();
      terminalStub.returns({
        sendText: sendTextStub,
        show: sinon.stub(),
        name: "",
        processId: Promise.resolve(0),
        creationOptions: fakeCreationOptions,
        exitStatus: undefined,
        state: fakeTerminalState,
        hide: function (): void {
          throw new Error("Function not implemented.");
        },
        dispose: function (): void {
          throw new Error("Function not implemented.");
        },
      });

      await openInDiffTool([
        vscode.Uri.parse("file:///path/to/file1"),
        vscode.Uri.parse("file:///path/to/file2"),
      ]);

      expect(terminalStub.calledOnce).to.be.true;
      expect(terminalStub.firstCall.args[0]).to.include("External Diff Tool");
      expect(sendTextStub.calledOnce).to.be.true;
      expect(sendTextStub.firstCall.args[0]).to.equal(
        "diff -rq /path/to/file1 /path/to/file2"
      );
    });
  });
});
