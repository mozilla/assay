import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { getFileDecorator } from "../../../src/config/globals";
import * as addonCache from "../../../src/model/cache";
import * as reviewRootDir from "../../../src/controller/directoryController";
import {
  fileHasComment
} from "../../../src/views/fileDecorations";

describe("fileDecorations.ts", async () => {
  beforeEach(() => {
    const getRootFolderPathStub = sinon.stub(
      reviewRootDir,
      "getRootFolderPath"
    );
    getRootFolderPathStub.resolves("test-root-folder-path/");
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("fileHasComment()", async () => {
    it("should return false if there are no comments in file.", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      getFromCacheStub.resolves({
        "test-guid": {
          "test-version-1" : {
            "/filepath-one": {
              "#L1": {
                "body": "test-comment",
                "uri": vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version-1/filepath-one"
                )
              },
            },
          },
          "test-version-2" : {
            "/filepath-two": {
              "#L1": {
                "body": "test-comment",
                "uri": vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version-2/filepath-two"
                )
              },
            },
          }
        }
      });

      const result = await fileHasComment(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );

      expect(result).to.be.false;
      expect(
        getFromCacheStub.calledWith("comments")
      ).to.be.true;
    });

    it("should return true if there are comments in file.", async () => {
        const getFromCacheStub = sinon.stub(addonCache, "getFromCache");

        getFromCacheStub.resolves({
          "test-guid": {
            "test-version" : {
              "/test-filepath": {
                "#L1": {
                  "body": "test-comment",
                  "uri": vscode.Uri.file(
                    "test-root-folder-path/test-guid/test-version/test-filepath"
                  )
                },
              },
            }
          }
          
        });

        const result = await fileHasComment(
          vscode.Uri.file(
            "test-root-folder-path/test-guid/test-version/test-filepath"
          )
        );

        expect(result).to.be.true;
        expect(
          getFromCacheStub.calledWith("comments")
        ).to.be.true;
    });
  });

  describe("provideFileDecoration()", async () => {
    it("should return the decoration if its a file and has a comment.", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      const decorator = getFileDecorator();

      sinon.stub(fs, 'lstatSync').returns({
        isFile: () => true
      } as fs.Stats);

      getFromCacheStub.resolves({
        "test-guid": {
          "test-version" : {
            "/test-filepath": {
              "#L1": {
                "body": "test-comment",
                "uri": vscode.Uri.file(
                  "test-root-folder-path/test-guid/test-version/test-filepath"
                )
              },
            }
          }
        }
        
      });

      const result = await decorator.provideFileDecoration(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );

      expect(result).to.deep.equal({
        badge: "✎",
        color: new vscode.ThemeColor("charts.green"),
        propagate: true,
      });
    });

    it("shouldnt return the decoration if its not a file", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      const decorator = getFileDecorator();

      sinon.stub(fs, 'lstatSync').returns({
        isFile: () => false
      } as fs.Stats);

      getFromCacheStub.resolves({
        "3.5.2" : {
          "/test-filepath": {
            "#L1": {
              "body": "test-comment",
              "uri": vscode.Uri.file(
                "test-root-folder-path/test-guid/test-version/test-filepath"
              )
            },
          }
        }
      });

      const result = await decorator.provideFileDecoration(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version"
        )
      );

      expect(result).to.be.undefined;
    });

    it("shouldnt return the decoration if there's no comment", async () => {
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      const decorator = getFileDecorator();

      sinon.stub(fs, 'lstatSync').returns({
        isFile: () => true
      } as fs.Stats);

      getFromCacheStub.resolves({});

      const result = await decorator.provideFileDecoration(
        vscode.Uri.file(
          "test-root-folder-path/test-guid/test-version/test-filepath"
        )
      );
      expect(result).to.be.undefined;
    });
  });

  describe("updateDecorations()", async () => {
    it("should notify subscribers of changes.", async () => {
      const decorator = getFileDecorator();
      const uri = vscode.Uri.file("test-root-folder-path/test-filepath");
      const fileDecoStub = sinon.stub(decorator['_onDidChangeFileDecorations'], 'fire');
      decorator.updateDecorations(uri);
      expect(fileDecoStub.called).to.be.true;
      expect(fileDecoStub.calledWith(uri)).to.be.true;
    });
  });

});

