import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  AddonTreeDataProvider,
  AddonTreeItem,
} from "../../../src/model/sidebarTreeDataProvider";

let addonTreeDataProvider: AddonTreeDataProvider;

describe("fileDecorationProvider.ts", async () => {
  beforeEach(() => {
    addonTreeDataProvider = new AddonTreeDataProvider("test-root");
    sinon.stub(fs, "statSync").callsFake(
      (filePath: fs.PathLike) =>
        ({
          isDirectory: () => filePath.toString().includes("Dir"),
        } as unknown as fs.Stats)
    );
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("sidebarTreeDataProvider.ts", async () => {
    describe("getTreeItem", () => {
      it("should return the element passed to it.", () => {
        const item = new AddonTreeItem(
          "file",
          vscode.Uri.parse("path/to/file")
        );
        const result = addonTreeDataProvider.getTreeItem(item);
        expect(result).to.equal(item);
      });
    });

    describe("getChildren", () => {
      it("should correctly get the directory children of the root folder, the downloaded guids, and ignore any files.", async () => {
        const fakeFiles = [
          "guidDir1",
          "junk1",
          "guidDir2",
          "guidDir3",
          "junk2",
        ];
        sinon.stub(fs, "readdir").yields(null, fakeFiles);

        const children = await addonTreeDataProvider.getChildren();
        expect(children).to.have.lengthOf(3);
      });

      it("should correctly get the directory children of the guid folder, the downloaded versions.", async () => {
        const fakeFiles = [
          "version1Dir",
          "junk1",
          "version2Dir",
          "junk2",
          "version3Dir",
          "version4Dir",
        ];
        sinon.stub(fs, "readdir").yields(null, fakeFiles);

        const item = new AddonTreeItem(
          "guid1",
          vscode.Uri.parse("test-root/guid1"),
          true
        );
        const children = await addonTreeDataProvider.getChildren(item);
        expect(children).to.have.lengthOf(4);
      });

      it("should correctly return NO children of the version folder, even if they exist.", async () => {
        const fakeFiles = [
          "file1",
          "junk1",
          "file2",
          "junk2",
          "file3",
          "file4Dir",
        ];
        sinon.stub(fs, "readdir").yields(null, fakeFiles);

        const item = new AddonTreeItem(
          "version1",
          vscode.Uri.parse("test-root/guid1/version1")
        );
        const children = await addonTreeDataProvider.getChildren(item);
        expect(children).to.have.lengthOf(0);
      });
    });
  });
});
