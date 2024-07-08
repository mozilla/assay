import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { CustomFileDecorationProvider } from "../../../src/model/fileDecorationProvider";

let fileDecorationProvider: CustomFileDecorationProvider;

describe("fileDecorationProvider.ts", async () => {
  beforeEach(() => {
    

    fileDecorationProvider = new CustomFileDecorationProvider();

  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("provideFileDecoration()", async () => {
    it("should return the decoration if the clause returns true.", async () => {
      fileDecorationProvider.setProvideDecorationClause(() => Promise.resolve(true));  

      const result = await fileDecorationProvider.provideFileDecoration(
        vscode.Uri.file(
          "test-uri"
        )
      );

      expect(result).to.deep.equal({
        badge: "✎",
        color: new vscode.ThemeColor("charts.green"),
        propagate: true,
      });

    });

    it("shouldnt return the decoration if the clause returns false.", async () => {
        fileDecorationProvider.setProvideDecorationClause(() => Promise.resolve(false));  

        const result = await fileDecorationProvider.provideFileDecoration(
          vscode.Uri.file(
            "test-uri"
          )
        );
  
        expect(result).to.be.undefined;
    });
  });

  describe("updateDecorations()", async () => {
    it("should notify subscribers of changes.", async () => {
      const uri = vscode.Uri.file("test-root-folder-path/test-filepath");
      const fileDecoStub = sinon.stub(fileDecorationProvider['_onDidChangeFileDecorations'], 'fire');
      fileDecorationProvider.updateDecorations(uri);
      expect(fileDecoStub.called).to.be.true;
      expect(fileDecoStub.calledWith(uri)).to.be.true;
    });
  });

});