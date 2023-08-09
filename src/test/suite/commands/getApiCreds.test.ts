import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  getCredsFromStorage,
  getApiKeyFromUser,
  getSecretFromUser,
} from "../../../amo/commands/getApiCreds";
import * as authUtils from "../../../config/globals";

describe("getApiCreds.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    const secretsStub = sinon.stub(authUtils, "getExtensionSecretStorage");
    secretsStub.returns({
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
    });
  });

  describe("getCredsFromStorage()", () => {
    it("should return the creds if they exist", async () => {
      const result = await getCredsFromStorage();
      expect(result.apiKey).to.equal("test");
      expect(result.secret).to.equal("test");
    });

    it("should error if the creds don't exist", async () => {
      // update the get of secretstub to return undefined
      sinon.restore();
      const secretsStub = sinon.stub(authUtils, "getExtensionSecretStorage");
      secretsStub.returns({
        get: async () => {
          return undefined;
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
      });
      const errorMessageWindowStub = sinon.stub(
        vscode.window,
        "showErrorMessage"
      );
      errorMessageWindowStub.resolves({ title: "Cancel" });
      try {
        await getCredsFromStorage();
      } catch (error: any) {
        expect(error.message).to.equal("No API Key or Secret found");
      }
    });
  });

  describe("getApiKeyFromUser()", () => {
    it("should return true the input is provided", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");
      const result = await getApiKeyFromUser();
      expect(result).to.be.true;
    });

    it("should raise an error if no input is provided", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves(undefined);
      try {
        await getApiKeyFromUser();
      } catch (error: any) {
        expect(error.message).to.equal("No API Key provided");
      }
    });
  });

  describe("getSecretFromUser()", () => {
    it("should return true if the input is provided", async () => {
      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.onFirstCall().resolves("test");

      const result = await getSecretFromUser();
      expect(result).to.be.true;
    });

    it("should raise an error if no input is provided", async () => {
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
