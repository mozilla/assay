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

  describe("getCredsFromStorage().", () => {
    it("should return the creds if they exist.", async () => {
      const result = await getCredsFromStorage();
      expect(result.apiKey).to.equal("test");
      expect(result.secret).to.equal("test");
    });

    it("should error if the creds don't exist.", async () => {
      sinon.restore();

      const secretsStub = sinon.stub(authUtils, "getExtensionSecretStorage");
      const secretsStubReturnUndefined = secretsStubReturn;
      secretsStubReturnUndefined.get = async () => {
        return "";
      };
      secretsStub.returns(secretsStubReturnUndefined);

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

});

import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import * as credUtils from "../../../src/commands/getApiCreds";
import { makeToken, makeAuthHeader } from "../../../src/utils/requestAuth";

describe("requestAuth.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("makeToken()", () => {
    it("should return the token.", async () => {
      const creds = {
        apiKey: "test",
        secret: "test",
      };
      const getCredsStub = sinon.stub(credUtils, "getCredsFromStorage");
      getCredsStub.resolves(creds);
      const result = await makeToken();
      expect(result).to.be.a("string");
    });
  });

  describe("makeAuthHeader()", () => {
    it("should return the auth header.", async () => {
      const creds = {
        apiKey: "test",
        secret: "test",
      };
      const getCredsStub = sinon.stub(credUtils, "getCredsFromStorage");
      getCredsStub.resolves(creds);
      const result = await makeAuthHeader();
      expect(result).to.have.property("Authorization");
    });
  });
});

