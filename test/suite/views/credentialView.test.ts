import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";


const secretsStubReturn = {
  get: async () => {
    return "test";
  },
  store: async () => {
    return;
  },
  delete: function (key: string): Thenable<void> {
    throw new Error("Function not implemented.");
  },
  onDidChange: function (
    listener: (e: vscode.SecretStorageChangeEvent) => any,
    thisArgs?: any,
    disposables?: vscode.Disposable[] | undefined
  ): vscode.Disposable {
    throw new Error("Function not implemented.");
  },
};

describe("getApiCreds.ts.", async () => {
  beforeEach(() => {
    const secretsStub = sinon.stub(authUtils, "getExtensionSecretStorage");
    secretsStub.returns(secretsStubReturn);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getApiKeyFromUser().", () => {
    it("should return true the input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");
      const result = await getApiKeyFromUser();
      expect(result).to.be.true;
    });

    it("should raise an error if no input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves(undefined);
      try {
        await getApiKeyFromUser();
      } catch (error: any) {
        expect(error.message).to.equal("No API Key provided");
      }
    });
  });

  describe("getSecretFromUser().", () => {
    it("should return true if the input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");

      const result = await getSecretFromUser();
      expect(result).to.be.true;
    });

    it("should raise an error if no input is provided.", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves(undefined);
      try {
        await getSecretFromUser();
      } catch (error: any) {
        expect(error.message).to.equal("No API Secret provided");
      }
    });
  });
});
