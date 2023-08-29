import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { downloadAddon } from "../../../src//utils/addonDownload";
import constants from "../../../src/config/config";
import * as authUtils from "../../../src/utils/requestAuth";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");

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

describe("addonDownload.ts", async () => {
  beforeEach(() => {
    const authStub = sinon.stub(authUtils, "makeAuthHeader");
    authStub.resolves({ Authorization: "test" });
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }
  });

  afterEach(async () => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      await fs.promises.rm(workspaceFolder, { recursive: true });
    }
    if (fs.existsSync(downloadedFilePath)) {
      await fs.promises.rm(downloadedFilePath, { recursive: true });
    }
  });

  it("should download the xpi of the addon", async () => {
    const fetchStub = sinon.stub();
    fetchStub.resolves(goodResponse);
    sinon.replace(fetch, "default", fetchStub as any);

    const existsSyncStub = sinon.stub(fs, "existsSync");
    existsSyncStub.onFirstCall().returns(true);

    await downloadAddon(addonId, downloadedFilePath);
    sinon.restore();

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    // wait for file to be written (there should be a better way to do this)
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(fs.existsSync(downloadedFilePath)).to.be.true;
  });

  it("should not make a file if the request failed", async () => {
    const fetchStub = sinon.stub();
    fetchStub.resolves(badResponse);
    sinon.replace(fetch, "default", fetchStub as any);

    const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
    showErrorMessageStub.resolves({ title: "Cancel" });

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Download request failed");
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to
        .be.true;

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(fs.existsSync(downloadedFilePath)).to.be.false;
    }
  });

  it("should throw an error if the user cancels", async () => {
    const fetchStub = sinon.stub();
    fetchStub.resolves(goodResponse);
    sinon.replace(fetch, "default", fetchStub as any);

    const existsSyncStub = sinon.stub(fs, "existsSync");
    existsSyncStub.onFirstCall().returns(false);
    existsSyncStub.onSecondCall().returns(true);

    const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
    showErrorMessageStub.resolves({ title: "Cancel" });

    try {
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Download failed");
    }
  });
});
