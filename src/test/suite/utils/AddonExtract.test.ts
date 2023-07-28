import { expect } from "chai";
import * as fs from "fs";
import * as jszip from "jszip";
import { afterEach, describe, it } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { extractAddon, dirExistsOrMake } from "../../../amo/utils/addonExtract";

describe("AddonExtract.ts", async () => {
  const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
  const compressedFilePath = path.resolve(workspaceFolder, "test-addon.xpi");

  afterEach(() => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      fs.rmSync(workspaceFolder, { recursive: true });
    }
  });

  async function createXPI() {
    const zip = new jszip();
    zip.file("test.txt", "test data inside txt");
    await zip.generateAsync({ type: "nodebuffer" }).then((content) => {
      fs.writeFileSync(compressedFilePath, content);
    });
  }

  const addonGUID = "test-addon";
  const addonVersion = "1.0.0";
  const extractedworkspaceFolder = path.resolve(workspaceFolder, addonGUID);
  const extractedVersionFolder = path.resolve(
    extractedworkspaceFolder,
    addonVersion
  );

  describe("extractAddon()", async () => {
    it("should extract a new addon, remove the xpi, and make files read only", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

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
      expect(fileStats.mode).to.equal(0o100444);
    });

    it("should overwrite an existing addon", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say yes
      const stub = sinon.stub();
      stub.onCall(0).returns("Yes");
      sinon.replace(vscode.window, "showQuickPick", stub);

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
      expect(fileStats.mode).to.equal(0o100444);

      const fileContent = fs.readFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "utf-8"
      );
      expect(fileContent).to.equal("test data inside txt");
    });

    it("should not overwrite an existing addon", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say no
      const stub = sinon.stub();
      stub.onCall(0).returns("No");
      sinon.replace(vscode.window, "showQuickPick", stub);

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

    it("should restart the process if the user selects to", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      const stub = sinon.stub(fs, "existsSync");
      stub.returns(false);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Fetch New Addon" });

      sinon.stub(vscode.commands, "executeCommand").returns(Promise.resolve());
      try {
        await extractAddon(
          compressedFilePath,
          extractedworkspaceFolder,
          extractedVersionFolder
        );
      } catch (e: any) {
        expect(e.message).to.equal("Process restarted");
      }
    });

    it("should try again if the user selects to", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      const stub = sinon.stub(vscode.window, "showErrorMessage");
      stub.onCall(0).resolves({ title: "Try Again" });

      const stub2 = sinon.stub(fs, "existsSync");
      stub2.onCall(2).returns(false);
      stub2.onCall(3).returns(true);
      stub2.onCall(4).returns(true);
      stub2.onCall(5).returns(true);
      stub2.onCall(6).returns(true);

      // make a stub for the quickpick and force it to say yes
      const stub3 = sinon.stub(vscode.window, "showQuickPick");
      stub3.resolves({ label: "Yes" });

      const stub4 = sinon.stub(fs, "unlinkSync");
      stub4.returns();

      await extractAddon(
        compressedFilePath,
        extractedworkspaceFolder,
        extractedVersionFolder
      );
      sinon.restore();
      expect(stub.calledOnce).to.be.true;
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(fs.existsSync(extractedVersionFolder)).to.be.true;
    });
  });

  describe("dirExistsOrMake()", async () => {
    it("should create a directory if it does not exist", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      const res = dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.true;
    });

    it("should not create a directory if it exists", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }

      fs.mkdirSync(extractedworkspaceFolder);

      const res = dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.undefined;
    });
  });
});
