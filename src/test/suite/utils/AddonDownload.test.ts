import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";

import { downloadAddon } from "../../../amo/utils/addonDownload";
import constants from "../../../config/config";

describe("addonDownload.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should download the xpi of the addon", async () => {
    console.log(constants.downloadBaseURL + "\n\n\n");
    // mock response
    const fakeResponse = {
      ok: true,
      buffer: () => {
        return "test data";
      },
    };

    const stub = sinon.stub();
    stub.resolves(fakeResponse);
    sinon.replace(fetch, "default", stub as any);

    const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const addonId = "123456";
    const addonSlug = "test-addon";
    const downloadedFilePath = path.resolve(
      workspaceFolder,
      `${addonSlug}.xpi`
    );

    await downloadAddon(addonId, downloadedFilePath);

    expect(stub.calledOnce).to.be.true;
    expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    // wait for file to be written (there should be a better way to do this)
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(fs.existsSync(downloadedFilePath)).to.be.true;

    fs.rmSync(downloadedFilePath, { recursive: true });
  });

  it("should not make a file if the request failed", async () => {
    const fakeResponse = {
      ok: false,
      buffer: () => {
        return "test data";
      },
    };

    const stub = sinon.stub();
    stub.resolves(fakeResponse);
    sinon.replace(fetch, "default", stub as any);

    const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    const addonId = "123456";
    const addonSlug = "test-addon";
    const downloadedFilePath = path.resolve(
      workspaceFolder,
      `${addonSlug}.xpi`
    );

    await downloadAddon(addonId, downloadedFilePath);
    expect(stub.calledOnce).to.be.true;
    expect(stub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
      .true;

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(fs.existsSync(downloadedFilePath)).to.be.false;
  });
});
