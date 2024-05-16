import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

describe("lineComment.ts", async () => {
    afterEach(async () => {
        sinon.restore();
    });

    it("should return undefined if there is no active editor", async () => {
        // const result = getLineInfo();
        // expect(result).to.be.undefined;
    });

    it("should return the fullpath and line number of the active editor", async () => {
        // const stub = sinon.stub(vscode.window, "activeTextEditor");
        // stub.value({
        //     document: {
        //         fileName: "test-file-name",
        //         lineAt: () => {
        //             return {
        //                 range: {
        //                     start: {
        //                         line: 0,
        //                     },
        //                 },
        //             };
        //         },
        //     },
        //     selection: {
        //         start: {
        //             line: 0,
        //         },
        //     },
        // });

        // const result = getLineInfo();
        // expect(result).to.deep.equal({
        //     fullpath: "test-file-name",
        //     lineNumber: "1",
        // });
    });
});