import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { downloadAddon } from "../../../amo/utils/addonDownload";
import * as authUtils from "../../../amo/utils/requestAuth";
import constants from "../../../config/config";

describe("addonDownload.ts", async () => {
  const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");

  afterEach(async () => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      await fs.promises.rm(workspaceFolder, { recursive: true });
    }
  });

  beforeEach(() => {
    const authStub = sinon.stub(authUtils, "makeAuthHeader");
    authStub.resolves({ Authorization: "test" });
  });

  const badResponse = {
    ok: false,
    buffer: () => {
      return "test data";
    },
  };

  const goodResponse = {
    ok: true,
    buffer: () => {
      return "test data";
    },
  };

  const addonId = "123456";
  const addonSlug = "test-addon";
  const downloadedFilePath = path.resolve(workspaceFolder, `${addonSlug}.xpi`);

  it("should download the xpi of the addon", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.resolves(goodResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(true);

    await downloadAddon(addonId, downloadedFilePath);
    sinon.restore();

    expect(stub.calledOnce).to.be.true;
    expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    // wait for file to be written (there should be a better way to do this)
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(fs.existsSync(downloadedFilePath)).to.be.true;

    fs.rmSync(downloadedFilePath, { recursive: true });
  });

  it("should not make a file if the request failed", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.resolves(badResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(vscode.window, "showErrorMessage");
    stub2.resolves({ title: "Cancel" });

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Request failed");
      expect(stub.calledOnce).to.be.true;
      expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
        .true;

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(fs.existsSync(downloadedFilePath)).to.be.false;
    }
  });

  it("should try again if the request failed", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.onFirstCall().resolves(badResponse);
    stub.onSecondCall().resolves(goodResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(true);

    const stub3 = sinon.stub(vscode.window, "showErrorMessage");
    stub3.onFirstCall().resolves({ title: "Try Again" });

    await downloadAddon(addonId, downloadedFilePath);
    expect(stub.calledTwice).to.be.true;
    expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    await new Promise((resolve) => setTimeout(resolve, 200));
    const exists = await fs.promises
      .access(downloadedFilePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    expect(exists).to.be.true;
  });

  it("should restart the get process if the user chooses to", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.onFirstCall().resolves(badResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(true);

    const stub3 = sinon.stub(vscode.window, "showErrorMessage");
    stub3.onFirstCall().resolves({ title: "Fetch New Addon" });

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Process restarted");
    }
  });

  it("should try again if the download failed", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.resolves(goodResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(false);
    stub2.onSecondCall().returns(true);

    const stub3 = sinon.stub(vscode.window, "showErrorMessage");
    stub3.resolves({ title: "Try Again" });

    await downloadAddon(addonId, downloadedFilePath);
    expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    await new Promise((resolve) => setTimeout(resolve, 200));
    const exists = await fs.promises
      .access(downloadedFilePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    expect(exists).to.be.true;
  });

  it("should restart the get process if the user chooses to", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.resolves(goodResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(false);
    stub2.onSecondCall().returns(true);

    const stub3 = sinon.stub(vscode.window, "showErrorMessage");
    stub3.resolves({ title: "Fetch New Addon" });

    sinon.stub(vscode.commands, "executeCommand").returns(Promise.resolve());

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Process restarted");
    }
  });

  it("should throw an error if the user cancels", async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const stub = sinon.stub();
    stub.resolves(goodResponse);
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(fs, "existsSync");
    stub2.onFirstCall().returns(false);
    stub2.onSecondCall().returns(true);

    const stub3 = sinon.stub(vscode.window, "showErrorMessage");
    stub3.resolves({ title: "Cancel" });

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Download failed");
    }
  });
});
