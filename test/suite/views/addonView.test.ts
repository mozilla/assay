import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AddonView } from "../../../src/views/addonView";

describe("addonView.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("promptVersionChoice()", () => {
    it("should show a quick pick with the version options.", async () => {
      const versions: string[] = [];
      for (let i = 0; i < 25; i++) {
        versions.push(i.toString());
      }

      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("5");
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);
      const result = await AddonView.promptVersionChoice(versions);
      expect(showQuickPickStub.calledOnce).to.be.true;
      expect(result).to.equal("5");
    });
  });

  describe("getInput()", () => {
    it("should return the input if provided.", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
      showInputBoxStub.resolves("test");
      const result = await AddonView.getInput();
      expect(result).to.equal("test");
    });

    it("should raise an error if no input is provided.", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");

      showInputBoxStub.resolves(undefined);
      try {
        await AddonView.getInput();
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });
  });
});
