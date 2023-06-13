import { expect } from "chai";
import * as fs from "fs";
import * as jszip from "jszip";
import { afterEach, describe, it } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { extractAddon } from "../../../amo/utils/addonExtract";

describe("AddonExtract.ts", async () => {
  afterEach(() => {
    sinon.restore();
    // remove test workspace
    const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
    if (fs.existsSync(workspaceFolder)) {
      fs.rmSync(workspaceFolder, { recursive: true });
    }
  });

  it("should extract a new addon, remove the xpi, and make files read only", async () => {
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
    const fileStats = fs.statSync(
      path.resolve(extractedVersionFolder, "test.txt")
    );
    expect(fileStats.mode).to.equal(0o100444);

    // remove created folders
    fs.rmSync(extractedworkspaceFolder, { recursive: true });
  });

  it("should overwrite an existing addon", async () => {
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
      workspaceFolder,
      addonGUID,
      addonVersion
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

    await extractAddon(
      compressedFilePath,
      workspaceFolder,
      addonGUID,
      addonVersion
    );

    expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
    expect(fs.existsSync(extractedVersionFolder)).to.be.true;
    expect(fs.existsSync(compressedFilePath)).to.be.false;

    const fileContent = fs.readFileSync(
      path.resolve(extractedVersionFolder, "test.txt"),
      "utf-8"
    );
    expect(fileContent).to.equal("replace me");
  });
});
