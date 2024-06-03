import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { setExtensionStoragePath } from "../../../src/config/globals";
import getDeleteCommentsPreference from "../../../src/utils/getDeleteCommentsPreference";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");
setExtensionStoragePath(storagePath);

describe("getdeleteComments.ts", () => {

      afterEach(async () => {
        sinon.restore();
      });

      describe("getDeleteCommentsPreference", () => {
        it("should return true when user's preference is to delete comments after export.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const config = {
                get: sinon.stub().returns("Yes"),
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.true;
        });

        it("should return false when user's preference is to not delete comments after export.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const config = {
                get: sinon.stub().returns("No"),
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
        });

        it("should prompt the user when their preference is to be asked every time, and return false on no response.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const config = {
                get: sinon.stub().returns("Ask Every Time"),
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onCall(0).returns(undefined);
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
        });

        it("should prompt the user when their preference is to be asked every time, and return their selection 'Yes' (true).", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const config = {
                get: sinon.stub().returns("Ask Every Time"),
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onCall(0).returns("Yes");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.true;
        });

        it("should prompt the user when their preference is to be asked every time, and return their selection 'No' (false).", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const config = {
                get: sinon.stub().returns("Ask Every Time"),
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onCall(0).returns("No");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
        });

        it("should prompt the user twice when their preference is not defined: once for their preference (Yes), once to save (Save my preference) then save and return preference.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const updateStub = sinon.stub();
            
            const config = {
                get: sinon.stub().returns(undefined),
                update: updateStub,
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onFirstCall().resolves("Yes");
            showQuickPickStub.onSecondCall().resolves("Save my Preference");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.true;
            expect(updateStub.calledOnce).to.be.true;
            expect(updateStub.calledWith("deleteCommentsOnExport", "Yes", true)).to.be.true;
        });

        it("should prompt the user twice when their preference is not defined: once for their preference (Yes), once to save (Ask Every Time) then save and return preference.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const updateStub = sinon.stub();
            
            const config = {
                get: sinon.stub().returns(undefined),
                update: updateStub,
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onFirstCall().resolves("Yes");
            showQuickPickStub.onSecondCall().resolves("Ask Every Time");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.true;
            expect(updateStub.calledOnce).to.be.true;
            expect(updateStub.calledWith("deleteCommentsOnExport", "Ask Every Time", true)).to.be.true;
        });

        it("should prompt the user twice when their preference is not defined: once for their preference (No), once to save (Save my preference) then save and return preference.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const updateStub = sinon.stub();
            
            const config = {
                get: sinon.stub().returns(undefined),
                update: updateStub,
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onFirstCall().resolves("No");
            showQuickPickStub.onSecondCall().resolves("Save my Preference");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
            expect(updateStub.calledOnce).to.be.true;
            expect(updateStub.calledWith("deleteCommentsOnExport", "No", true)).to.be.true;
        });

        it("should prompt the user twice when their preference is not defined: once for their preference (No), once to save (Ask Every Time) then save and return preference.", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const updateStub = sinon.stub();
            
            const config = {
                get: sinon.stub().returns(undefined),
                update: updateStub,
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onFirstCall().resolves("No");
            showQuickPickStub.onSecondCall().resolves("Ask Every Time");
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
            expect(updateStub.calledOnce).to.be.true;
            expect(updateStub.calledWith("deleteCommentsOnExport", "Ask Every Time", true)).to.be.true;
        });

        it("should prompt the user twice when their preference is not defined: once for their preference and once to save (early termination).", async () => {
            const configStub = sinon.stub(vscode.workspace, "getConfiguration");
            const updateStub = sinon.stub();
            
            const config = {
                get: sinon.stub().returns(undefined),
                update: updateStub,
            } as unknown as vscode.WorkspaceConfiguration;
            configStub.returns(config);

            const showQuickPickStub = sinon.stub();
            showQuickPickStub.onFirstCall().resolves("No");
            showQuickPickStub.onSecondCall().resolves(undefined);
            sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

            const result = await getDeleteCommentsPreference();
            expect(result).to.be.false;
            expect(updateStub.called).to.be.false;
        });
        
      });

});