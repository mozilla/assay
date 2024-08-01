import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { QPOption } from "../../../src/types";
import { ExportView } from "../../../src/views/exportView";

const showQuickPickStub = sinon.stub();
const updateStub = sinon.stub();
const config = {
  get: sinon.stub(),
  update: updateStub,
};

describe("exportView.ts", () => {
  beforeEach(() => {
    const configStub = sinon.stub(vscode.workspace, "getConfiguration");
    configStub.returns(config as unknown as vscode.WorkspaceConfiguration);
    updateStub.reset();
    showQuickPickStub.reset();
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("getDeleteCommentsPreference", () => {
    it("should return true when user's preference is to delete comments after export.", async () => {
      config.get.returns(QPOption.Yes);
      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.true;
    });

    it("should return false when user's preference is to not delete comments after export.", async () => {
      config.get.returns(QPOption.No);
      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
    });

    it("should prompt the user when their preference is to be asked every time, and return false on no response.", async () => {
      config.get.returns(QPOption.Ask);

      showQuickPickStub.onCall(0).returns(undefined);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
    });

    it("should prompt the user when their preference is to be asked every time, and return their selection 'Yes' (true).", async () => {
      config.get.returns(QPOption.Ask);

      showQuickPickStub.onCall(0).returns(QPOption.Yes);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.true;
    });

    it("should prompt the user when their preference is to be asked every time, and return their selection 'No' (false).", async () => {
      config.get.returns(QPOption.Ask);

      showQuickPickStub.onCall(0).returns(QPOption.No);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
    });

    it("should prompt the user twice when their preference is not defined: once for their preference ('Yes') and once to save ('Save my preference') then save, and then return preference.", async () => {
      config.get.returns(undefined);

      showQuickPickStub.onFirstCall().resolves(QPOption.Yes);
      showQuickPickStub.onSecondCall().resolves(QPOption.Save);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.true;
      expect(updateStub.calledOnce).to.be.true;
      expect(
        updateStub.calledWith("deleteCommentsOnExport", QPOption.Yes, true)
      ).to.be.true;
    });

    it("should prompt the user twice when their preference is not defined: once for their preference ('Yes') and once to save ('Ask Every Time') then save, and then return preference.", async () => {
      config.get.returns(undefined);

      showQuickPickStub.onFirstCall().resolves(QPOption.Yes);
      showQuickPickStub.onSecondCall().resolves(QPOption.Ask);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.true;
      expect(updateStub.calledOnce).to.be.true;
      expect(
        updateStub.calledWith("deleteCommentsOnExport", QPOption.Ask, true)
      ).to.be.true;
    });

    it("should prompt the user twice when their preference is not defined: once for their preference ('No') and once to save ('Save my preference') then save, and then return preference.", async () => {
      config.get.returns(undefined);

      showQuickPickStub.onFirstCall().resolves(QPOption.No);
      showQuickPickStub.onSecondCall().resolves(QPOption.Save);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.calledWith("deleteCommentsOnExport", QPOption.No, true))
        .to.be.true;
    });

    it("should prompt the user twice when their preference is not defined: once for their preference ('No') and once to save ('Ask Every Time') then save, and then return preference.", async () => {
      config.get.returns(undefined);

      showQuickPickStub.onFirstCall().resolves(QPOption.No);
      showQuickPickStub.onSecondCall().resolves(QPOption.Ask);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
      expect(updateStub.calledOnce).to.be.true;
      expect(
        updateStub.calledWith("deleteCommentsOnExport", QPOption.Ask, true)
      ).to.be.true;
    });

    it("should prompt the user twice when their preference is not defined: once for their preference  and once to save (early termination).", async () => {
      config.get.returns(undefined);

      showQuickPickStub.onFirstCall().resolves(QPOption.No);
      showQuickPickStub.onSecondCall().resolves(undefined);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await ExportView.getDeleteCommentsPreference();
      expect(result).to.be.false;
      expect(updateStub.called).to.be.false;
    });
  });
});
