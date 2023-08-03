import { expect } from "chai";
import * as keytar from "keytar";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  getCredsFromStorage,
  getApiKeyFromUser,
  getSecretFromUser,
} from "../../../amo/commands/getApiCreds";

describe("getApiCreds.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    const setPasswordStub = sinon.stub(keytar, "setPassword");
    setPasswordStub.resolves();
  });

  describe("getCredsFromStorage()", () => {
    it("should return the creds if they exist", async () => {
      const keytarGetPasswordStub = sinon.stub(keytar, "getPassword");
      keytarGetPasswordStub.resolves("test");
      const result = await getCredsFromStorage();
      expect(result.apiKey).to.equal("test");
      expect(result.secret).to.equal("test");
    });

    it("should error if the creds don't exist", async () => {
      const keytarGetPasswordStub = sinon.stub(keytar, "getPassword");
      keytarGetPasswordStub.resolves(undefined);
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
