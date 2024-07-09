import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { RootView } from "../../../src/views/rootView";

describe("rootView.ts", () => {

    afterEach(async () => {
    sinon.restore();
    });

    describe("selectRootFolder()", async () => {
        it("should return undefined if no folder is chosen.", async () => { 
            const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
            const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves();
            showOpenDialogStub.resolves(undefined);

            const result = await RootView.selectRootFolder();
            expect(showInformationMessageStub.called).to.be.true;
            expect(result).to.be.undefined;
        });

        it("should return the chosen folder.", async () => {
            const showOpenDialogStub = sinon.stub(vscode.window, "showOpenDialog");
            const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves();
        
            const uri = vscode.Uri.file("test");
            showOpenDialogStub.resolves([uri]);

            const result = await RootView.selectRootFolder();
            expect(showInformationMessageStub.called).to.be.true;
            expect(result).to.equal("/test");
        });
    });
});
