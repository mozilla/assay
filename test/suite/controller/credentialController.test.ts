import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";


import { CredentialController } from "../../../src/controller/credentialController";
import { CredentialView } from "../../../src/views/credentialView";

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

    describe("getApiKeyfromUser()", () => {

      it("should return true when the new API key is successfully stored.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        sinon.stub(credentialController, "getCredsFromStorage").resolves(creds);
        sinon.stub(CredentialView, "getApiKeyInputFromUser").resolves("newApiKey");
        const result = await credentialController.getApiKeyFromUser();
        expect(result).to.be.true;
      });

      it("should return false when the new API key is unsuccessfully stored.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        sinon.stub(credentialController, "getCredsFromStorage").resolves(creds);
        sinon.stub(CredentialView, "getApiKeyInputFromUser").throws();
        const result = await credentialController.getApiKeyFromUser();
        expect(result).to.be.false;
      });

    });

    describe("getSecretFromUser()", () => {

      it("should return true when the new API secret is successfully stored.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        sinon.stub(CredentialView, "getSecretInputFromUser").resolves("newApiSecret");
        const result = await credentialController.getSecretFromUser();
        expect(result).to.be.true;
      });

      it("should return false when the new API secret is unsuccessfully stored.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        sinon.stub(CredentialView, "getSecretInputFromUser").throws();
        const result = await credentialController.getSecretFromUser();
        expect(result).to.be.false;
      });

    });

    describe("testApiCredentials()", () => {

      it("should show an information message if successful.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        const showInformationMessageStub = sinon.stub(vscode.window, "showInformationMessage");
        sinon.stub(credentialController, "makeAuthHeader").resolves();
        const fetchStub = sinon.stub();
        sinon.replace(fetch, "default", fetchStub as any);


        fetchStub.resolves({
            status: 200
        } as unknown as Response);


        const result = await credentialController.testApiCredentials();
        expect(result).to.be.true;
        // expect(showInformationMessageStub.called).to.be.true;

      });

      it("should show an error message if failed.", async () => {
        const credentialController = new CredentialController(secretStorageStub);
        const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage").resolves();
        sinon.stub(credentialController, "makeAuthHeader").resolves();
        const fetchStub = sinon.stub(global, "fetch");
        fetchStub.resolves({
            status: 401
        } as unknown as Response);
        const result = await credentialController.testApiCredentials();
        expect(result).to.be.false;
        expect(showErrorMessageStub.called).to.be.true;
      });

    });

});
