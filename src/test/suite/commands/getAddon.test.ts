import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { downloadAndExtract } from "../../../amo/commands/getAddon";

describe("getAddon.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    const stub = sinon.stub(vscode.window, "showOpenDialog");
    const uri = vscode.Uri.file("test");
    stub.resolves([uri]);
  });

  it("should return undefined if no input is provided", async () => {
    sinon.stub(vscode.window, "showInputBox").resolves(undefined);
    const result = await downloadAndExtract("");
    expect(result).to.be.undefined;
  });

  it("should return undefined if no version is found", async () => {
    const stub = sinon.stub(vscode.window, "showInputBox");
    stub.onFirstCall().resolves("test");

    const module = await import("../../../amo/utils/addonVersions");
    const getVersionChoiceStub = sinon.stub(module, "getVersionChoice");
    getVersionChoiceStub.resolves(undefined);

    const result = await downloadAndExtract("");
    expect(result).to.be.undefined;
  });

  it("should return undefined if no metadata is found", async () => {
    const stub = sinon.stub(vscode.window, "showInputBox");
    stub.onFirstCall().resolves("test");

    const module = await import("../../../amo/utils/addonVersions");
    const getVersionChoiceStub = sinon.stub(module, "getVersionChoice");
    getVersionChoiceStub.resolves({ fileID: "1", version: "test" });

    const module2 = await import("../../../amo/utils/addonInfo");
    const addonInfoStub = sinon.stub(module2, "getAddonInfo");
    addonInfoStub.resolves(undefined);

    const result = await downloadAndExtract("");
    expect(result).to.be.undefined;
  });

  it("should return undefined if the download fails", async () => {
    const stub = sinon.stub(vscode.window, "showInputBox");
    stub.onFirstCall().resolves("test");

    const module = await import("../../../amo/utils/addonVersions");
    const getVersionChoiceStub = sinon.stub(module, "getVersionChoice");
    getVersionChoiceStub.resolves({ fileID: "1", version: "test" });

    const module2 = await import("../../../amo/utils/addonInfo");
    const addonInfoStub = sinon.stub(module2, "getAddonInfo");
    addonInfoStub.resolves({
      id: "test",
      name: {
        en: "test",
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      default_locale: "en",
      slug: "test",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      review_url: "test",
      guid: "test",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_version: {
        version: "test",
        file: {
          id: "1",
        },
      },
    });

    const module3 = await import("../../../amo/utils/addonCache");
    const addToCacheStub = sinon.stub(module3, "addToCache");
    addToCacheStub.resolves(undefined);
    const stub3 = sinon.stub(vscode.workspace, "workspaceFolders");
    stub3.value([
      {
        uri: {
          fsPath: "test",
        },
      },
    ]);

    const result = await downloadAndExtract("");
    expect(result).to.be.undefined;
  });

  it("should return undefined if the extraction fails", async () => {
    const stub = sinon.stub(vscode.window, "showInputBox");
    stub.onFirstCall().resolves("test");

    const module = await import("../../../amo/utils/addonVersions");
    const getVersionChoiceStub = sinon.stub(module, "getVersionChoice");
    getVersionChoiceStub.resolves({ fileID: "1", version: "test" });

    const module2 = await import("../../../amo/utils/addonInfo");
    const addonInfoStub = sinon.stub(module2, "getAddonInfo");
    addonInfoStub.resolves({
      id: "test",
      name: {
        en: "test",
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      default_locale: "en",
      slug: "test",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      review_url: "test",
      guid: "test",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_version: {
        version: "test",
        file: {
          id: "1",
        },
      },
    });

    const module3 = await import("../../../amo/utils/addonCache");
    const addToCacheStub = sinon.stub(module3, "addToCache");
    addToCacheStub.resolves(undefined);
    const stub3 = sinon.stub(vscode.workspace, "workspaceFolders");
    stub3.value([
      {
        uri: {
          fsPath: "test",
        },
      },
    ]);

    const stub4 = sinon.stub(fs, "existsSync");
    stub4.onFirstCall().returns(true);
    stub4.onSecondCall().returns(false);

    const result = await downloadAndExtract("");
    expect(result).to.be.undefined;
  });
});
