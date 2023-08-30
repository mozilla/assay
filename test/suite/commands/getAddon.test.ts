import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { getInput } from "../../../src/commands/getAddon";

describe("getAddon.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getInput()", () => {
    it("should return the input if provided", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
      showInputBoxStub.onFirstCall().resolves("test");
      const result = await getInput();
      expect(result).to.equal("test");
    });

    it("should raise an error if no input is provided", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
      showInputBoxStub.onFirstCall().resolves(undefined);
      try {
        await getInput();
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });
  });
});
