import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import * as getThreadLocation from "../../../src/utils/helper";
import revealFile from "../../../src/utils/revealFile";

describe("revealFile.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });
  describe("revealFile()", () => {
    
    it("should reveal the document located at URI.", async () => {
        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        const URI = vscode.Uri.parse("index.html");

        await revealFile(URI);

        expect(showTextDocumentStub.calledOnce).to.be.true;
        expect(showTextDocumentStub.firstCall.args[0]).to.deep.equal(URI);
    });

    it("should reveal the document located at URI and correctly highlight and reveal the desired range", async () => {
        const range = new vscode.Range(new vscode.Position(24, 0), new vscode.Position(24, 0));
        const stringToRangeStub = sinon.stub(getThreadLocation, "stringToRange").resolves(range);
        const revealRangeStub = sinon.stub();

        const fakeEditor = {
            revealRange: revealRangeStub,
            selections: [],
        } as unknown as vscode.TextEditor;

        const URI = vscode.Uri.file("index.html");
        const lineNumber = "#L25";

        const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
        showTextDocumentStub.resolves(fakeEditor);

        await revealFile(URI, lineNumber);

        expect(stringToRangeStub.calledOnce).to.be.true;
        expect(revealRangeStub.calledOnce).to.be.true;
        expect(revealRangeStub.firstCall.args[0]).to.deep.equal(range);
    });
  

  });
});
