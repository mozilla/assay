import { extractAddon } from "../../../amo/utils/addonExtract";

import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as jszip from "jszip";
import * as fs from "fs";
import path = require("path");

describe("AddonExtract.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should extract the addon, remove the xpi", async () => {
    const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }

    // create xpi file
    const zip = new jszip();
    zip.file("test.txt", "test data inside txt");
    const compressedFilePath = path.resolve(workspaceFolder, "test-addon.xpi");
    await zip.generateAsync({ type: "nodebuffer" }).then((content) => {
      fs.writeFileSync(compressedFilePath, content);
    });

    // extract xpi
    const addonGUID = "test-addon";
    const addonVersion = "1.0.0";
    const extractedworkspaceFolder = path.resolve(
      workspaceFolder,
      "test-addon"
    );
    const extractedVersionFolder = path.resolve(
      extractedworkspaceFolder,
      addonVersion
    );
    await extractAddon(
      compressedFilePath,
      workspaceFolder,
      addonGUID,
      addonVersion
    );

    expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
    expect(fs.existsSync(extractedVersionFolder)).to.be.true;
    expect(fs.existsSync(compressedFilePath)).to.be.false;

    // remove created folders
    fs.rmSync(extractedworkspaceFolder, { recursive: true });
  });
});
