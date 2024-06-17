import { expect } from "chai";
import * as child_process from "child_process";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as node_fetch from "node-fetch";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  updateAssay,
  checkAndGetNewVersion,
  installNewVersion,
  downloadVersion,
} from "../../../src/controller/updateController";

describe("updateAssay.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("updateAssay()", () => {
    it("should return false if the version is up to date.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        json: () => {
          return { tag_name: "1.0.0" };
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ packageJSON: { version: "1.0.0" } } as any);

      expect(await updateAssay()).to.equal(false);
    });
  });

  describe("checkAndGetNewVersion()", () => {
    it("should throw an error if the request fails.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({ ok: false, statusText: "error message" } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      try {
        await checkAndGetNewVersion();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).to.equal(
          "Could not fetch latest version from GitHub: error message"
        );
      }
    });

    it("should return false if the version is up to date.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        json: () => {
          return { tag_name: "1.0.0" };
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ packageJSON: { version: "1.0.0" } } as any);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );
      showInformationMessageStub.resolves();

      const result = await checkAndGetNewVersion();
      expect(result).to.equal(false);
      expect(showInformationMessageStub.calledOnce).to.equal(true);
    });

    it("should return the download link and version if the version is not up to date.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        json: () => {
          return {
            tag_name: "1.0.1",
            assets: [{ browser_download_url: "https://github.com/release/test" }],
          };
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ packageJSON: { version: "1.0.0" } } as any);

      const result = await checkAndGetNewVersion();
      expect(result).to.deep.equal({
        downloadLink: "https://github.com/release/test",
        version: "1.0.1",
      });
    });
  });

  describe("installNewVersion()", () => {
    const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
    beforeEach(async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        buffer: () => {
          return "file contents";
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ extensionPath: workspaceFolder } as any);
    });

    afterEach(() => {
      if (fs.existsSync(workspaceFolder)) {
        fs.rmdirSync(workspaceFolder, { recursive: true });
      }
    });

    it("should spawn a new process to install the new version and remove the file when done.", async () => {
      const spawnStub = sinon.stub(child_process, "spawn");
      const event = {
        on: sinon.stub().callsFake(async (event, callback) => {
          if (event === "exit") {
            callback(0); // Simulate a successful installation with exit code 0
          }
        }),
      };
      spawnStub.returns(event as any);

      const unlinkSyncStub = sinon.stub(fs, "unlinkSync");
      unlinkSyncStub.returns(undefined);

      const showInformationMessageStub = sinon.stub(
        vscode.window,
        "showInformationMessage"
      );
      showInformationMessageStub.resolves();

      await installNewVersion("https://github.com/release/test", "1.0.0");
      expect(spawnStub.calledOnce).to.equal(true);
      expect(
        spawnStub.calledWith("code", [
          "--install-extension",
          `${workspaceFolder}/version.vsix`,
        ])
      ).to.equal(true);
      expect(unlinkSyncStub.calledOnce).to.equal(true);
      expect(
        unlinkSyncStub.calledWith(`${workspaceFolder}/version.vsix`)
      ).to.equal(true);
      expect(showInformationMessageStub.calledOnce).to.equal(true);
      expect(
        showInformationMessageStub.calledWith(
          "Assay updated to version 1.0.0. Please reload VSCode."
        )
      ).to.equal(true);
    });

    it("should throw an error if the installation fails.", async () => {
      const spawnStub = sinon.stub(child_process, "spawn");
      const event = {
        on: sinon.stub().callsFake(async (event, callback) => {
          if (event === "exit") {
            callback(1);
          }
        }),
      };
      spawnStub.returns(event as any);

      const showErrorMessageStub = sinon.stub(
        vscode.window,
        "showErrorMessage"
      );
      showErrorMessageStub.resolves();
      await installNewVersion("https://github.com/release/test", "1.0.0");
      expect(showErrorMessageStub.calledOnce).to.equal(true);
      expect(
        showErrorMessageStub.calledWith(
          "Assay could not be updated to version 1.0.0. Please try again."
        )
      ).to.equal(true);
    });
  });

  describe("downloadVersion()", () => {
    it("should throw an error if the request fails.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({ ok: false, statusText: "error message" } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      try {
        await downloadVersion("test");
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).to.equal(
          "Could not fetch version file from GitHub: error message"
        );
      }
    });

    it("should throw an error if the extension path cannot be found.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        buffer: () => {
          return "file contents";
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns(undefined);

      try {
        await downloadVersion("https://github.com/release/test");
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).to.equal("Could not find extension path");
      }
    });

    it("should throw an error if the file cannot be saved.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        buffer: () => {
          return "file contents";
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ extensionPath: "test/path/" } as any);

      const createWriteStreamStub = sinon.stub(fs, "createWriteStream");
      createWriteStreamStub.throws(new Error("error message"));

      try {
        await downloadVersion("https://github.com/release/test");
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).to.equal("Could not write version file: error message");
      }
    });

    it("should return the save path if the file is saved.", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        buffer: () => {
          return "file contents";
        },
      } as any);
      sinon.replace(node_fetch, "default", fetchStub as any);

      const getExtensionStub = sinon.stub(vscode.extensions, "getExtension");
      getExtensionStub.returns({ extensionPath: workspaceFolder } as any);

      const returnedPath = await downloadVersion("https://github.com/release/test");
      expect(returnedPath).to.equal(
        path.resolve(workspaceFolder, "version.vsix")
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(fs.existsSync(returnedPath)).to.equal(true);
      fs.rmdirSync(workspaceFolder, { recursive: true });
    });
  });
});
