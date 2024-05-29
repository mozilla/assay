import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as getThreadLocation from "../../../src/utils/getThreadLocation";
import revealFile from "../../../src/utils/revealFile";

describe("revealFile.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });
  describe("revealFile()", () => {
    
    it("should reveal the document located at uri.", async () => {
        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        const uri = vscode.Uri.parse("index.html");

        await revealFile(uri);

        expect(showTextDocumentStub.calledOnce).to.be.true;
        expect(showTextDocumentStub.firstCall.args[0]).to.deep.equal(uri);
    });

    it("should reveal the document located at uri and correctly highlight and reveal the desired range", async () => {
        const range = new vscode.Range(new vscode.Position(24, 0), new vscode.Position(24, 0));
        const stringToRangeStub = sinon.stub(getThreadLocation, "stringToRange").resolves(range);
        const revealRangeStub = sinon.stub();

        const fakeEditor = {
            revealRange: revealRangeStub,
            selections: [],
        } as unknown as vscode.TextEditor;

        const uri = vscode.Uri.file("index.html");
        const lineNumber = "#L25";

        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        showTextDocumentStub.resolves(fakeEditor);

        await revealFile(uri, lineNumber);

        expect(stringToRangeStub.calledOnce).to.be.true;
        expect(revealRangeStub.calledOnce).to.be.true;
        expect(revealRangeStub.firstCall.args[0]).to.deep.equal(range);
    });
  

  });
});
