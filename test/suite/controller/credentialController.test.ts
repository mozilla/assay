import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CredentialController } from "../../../src/controller/credentialController";

const secretStorageStub = {
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

const creds = {
    apiKey: "test",
    secret: "test",
};
    
describe("credentialController.ts.", async () => {

    afterEach(() => {
        sinon.restore();
    });

    describe("getCredsFromStorage().", () => {
        it("should return the creds if they exist.", async () => {
            const credentialController = new CredentialController(secretStorageStub);
            const result = await credentialController.getCredsFromStorage();
            expect(result.apiKey).to.equal("test");
            expect(result.secret).to.equal("test");
        });

        it("should error if the creds don't exist.", async () => {

            const secretStorageStubUndefined = secretStorageStub;
            secretStorageStubUndefined.get = async () => {
                return "";
            };

            const credentialController = new CredentialController(secretStorageStubUndefined);


            const errorMessageWindowStub = sinon.stub(
                vscode.window,
                "showErrorMessage"
            );
            errorMessageWindowStub.resolves({ title: "Cancel" });

            try {
                await credentialController.getCredsFromStorage();
            } catch (error: any) {
                expect(error.message).to.equal("No API Key or Secret found");
            }
        });
    });

    describe("makeAuthHeader()", () => {
        it("should return the auth header.", async () => {
            const credentialController = new CredentialController(secretStorageStub);
            sinon.stub(credentialController, "getCredsFromStorage").resolves(creds);
        const result = await credentialController.makeAuthHeader();
        expect(result).to.have.property("Authorization");
        });
    });

});
