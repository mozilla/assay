import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as credUtils from "../../../amo/commands/getApiCreds";
import { makeToken, makeAuthHeader } from "../../../amo/utils/requestAuth";

describe("requestAuth.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("makeToken()", () => {
    it("should return the token", async () => {
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
    it("should return the auth header", async () => {
      const creds = {
        apiKey: "test",
        secret: "test",
      };
      const getCredsStub = sinon.stub(credUtils, "getCredsFromStorage");
      getCredsStub.resolves(creds);
      const result = await makeAuthHeader();
      // expect it to have a key called authorization
      expect(result).to.have.property("Authorization");
    });
  });
});
