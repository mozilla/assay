import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { setDiffCommand, getDiffCommand } from "../../../src/utils/diffTool";

describe("diffTool.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("setDiffCommand()", () => {
    it("should return undefined if no input is provided", async () => {
      const config = vscode.workspace.getConfiguration("assay");
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.resolves(undefined);
      const result = await setDiffCommand(config);
      expect(result).to.be.undefined;
    });

    it("should return the input and update the config if input is provided", async () => {
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
    it("should return the diff command from the config if it exists", async () => {
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
