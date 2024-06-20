import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CredentialView } from "../../../src/views/credentialView";



describe("CredentialView.ts.", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getApiKeyFromUser().", () => {
    it("should return the input if provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");
      const result = await CredentialView.getApiKeyInputFromUser("placeholder");
      expect(result).to.equal("test");
    });

    it("should raise an error if no input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves(undefined);
      try {
        await CredentialView.getApiKeyInputFromUser("placeholder");
      } catch (error: any) {
        expect(error.message).to.equal("No API Key provided.");
      }
    });
  });

  describe("getSecretFromUser().", () => {
    it("should return true if the input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");
      const result = await CredentialView.getSecretInputFromUser("placeholder");
      expect(result).to.equal("test");
    });

    it("should raise an error if no input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves(undefined);
      try {
        await CredentialView.getSecretInputFromUser("placeholder");
      } catch (error: any) {
        expect(error.message).to.equal("No API Secret provided.");
      }
    });
  });
});
