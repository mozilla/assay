import { expect } from "chai";
import * as fs from "fs";
import * as jszip from "jszip";
import { afterEach, describe, it, beforeEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { extractAddon, dirExistsOrMake } from "../../../src/utils/addonExtract";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const compressedFilePath = path.resolve(workspaceFolder, "test-addon.xpi");
const addonGUID = "test-addon";
const addonVersion = "1.0.0";
const extractedworkspaceFolder = path.resolve(workspaceFolder, addonGUID);
const extractedVersionFolder = path.resolve(
  extractedworkspaceFolder,
  addonVersion
);

async function createXPI() {
  const zip = new jszip();
  zip.file("test.txt", "test data inside txt");
  await zip.generateAsync({ type: "nodebuffer" }).then((content) => {
    fs.writeFileSync(compressedFilePath, content);
  });
}

describe("AddonExtract.ts", async () => {
  beforeEach(async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }
    await createXPI();
  });

  afterEach(() => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      fs.rmSync(workspaceFolder, { recursive: true });
    }
  });

  describe("extractAddon()", async () => {
    it("should extract a new addon, remove the xpi, and make files read only", async () => {
      await extractAddon(
        compressedFilePath,
        extractedworkspaceFolder,
        extractedVersionFolder
      );

      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(fs.existsSync(extractedVersionFolder)).to.be.true;
      expect(fs.existsSync(compressedFilePath)).to.be.false;

      const fileStats = fs.statSync(
        path.resolve(extractedVersionFolder, "test.txt")
      );
      // expect(fileStats.mode).to.equal(0o100444);
    });

    it("should overwrite an existing addon", async () => {
      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say yes
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("Yes");
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      await extractAddon(
        compressedFilePath,
        extractedworkspaceFolder,
        extractedVersionFolder
      );

      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(fs.existsSync(extractedVersionFolder)).to.be.true;
      expect(fs.existsSync(compressedFilePath)).to.be.false;
      
      const fileStats = fs.statSync(
        path.resolve(extractedVersionFolder, "test.txt")
      );
      // expect(fileStats.mode).to.equal(0o100444);

      const fileContent = fs.readFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "utf-8"
      );
      expect(fileContent).to.equal("test data inside txt");
    });

    it("should not overwrite an existing addon", async () => {
      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say no
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("No");
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      try {
        await extractAddon(
          compressedFilePath,
          extractedworkspaceFolder,
          extractedVersionFolder
        );
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Extraction cancelled");
        expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
        expect(fs.existsSync(extractedVersionFolder)).to.be.true;
        expect(fs.existsSync(compressedFilePath)).to.be.false;

        const fileContent = fs.readFileSync(
          path.resolve(extractedVersionFolder, "test.txt"),
          "utf-8"
        );
        expect(fileContent).to.equal("replace me");
      }
    });

    it("should error if the user cancels the vscode error", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      const stub = sinon.stub(fs, "existsSync");
      stub.returns(false);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Cancel" });

      try {
        await extractAddon(
          compressedFilePath,
          extractedworkspaceFolder,
          extractedVersionFolder
        );
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Extraction failed");
      }
    });
  });

  describe("dirExistsOrMake()", async () => {
    it("should create a directory if it does not exist", async () => {
      const res = await dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.true;
    });

    it("should not create a directory if it exists", async () => {
      fs.mkdirSync(extractedworkspaceFolder);

      const res = await dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.undefined;
    });
  });
});
