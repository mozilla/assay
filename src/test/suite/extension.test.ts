import * as assert from "assert";
import * as vscode from "vscode";

import { downloadAddon } from "../../utils/AddonDownload";
import { extractAddon } from "../../utils/AddonExtract";
import { getAddonVersions } from "../../utils/AddonVersions";
import { getAddonInfo } from "../../utils/AddonInfo";

import { AddonInfoResponse } from "../../interfaces";

import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as fetch from "node-fetch";
import * as jszip from "jszip";
import * as fs from "fs";
import path = require("path");

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  describe("Addon Info Successful", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("should return a json object of type AddonInfoResponse", async () => {
      const input = "test-addon";
      const expected: AddonInfoResponse = {
        slug: "test-addon",
        name: {
          en: "Test addon",
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        current_version: {
          version: "1.0.0",
          file: {
            id: "123456",
          },
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        default_locale: "en",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        review_url: "https://addons.mozilla.org/en-US/firefox/addon/test-addon",
        guid: "gee you eye dee",
      };

      const stub: sinon.SinonStub<any[], any> = sinon.stub();
      stub.resolves({
        json: () => expected,
      });
      sinon.replace(fetch, "default", stub as any);

      const actual = await getAddonInfo(input);
      expect(actual).to.deep.equal(expected);
      expect(stub.calledOnce).to.be.true;
      expect(
        stub.calledWith(
          `https://addons.mozilla.org/api/v5/addons/addon/${expected.slug}`
        )
      ).to.be.true;
    });
  });

  describe("Addon Extract", async () => {
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
      const compressedFilePath = path.resolve(
        workspaceFolder,
        "test-addon.xpi"
      );
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
  
  describe("Addon Download", async () => {
    afterEach(() => {
      sinon.restore();
    });

    it("should download the xpi of the addon", async () => {
      // mock response
      const fakeResponse = {
        ok: true,
        buffer: () => {
          return "test data";
        },
      };

      const stub: sinon.SinonStub<any[], any> = sinon.stub();
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
      expect(
        stub.calledWith(
          `https://addons.mozilla.org/firefox/downloads/file/${addonId}`
        )
      ).to.be.true;

      // wait for file to be written (there should be a better way to do this)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(fs.existsSync(downloadedFilePath)).to.be.true;

      fs.rmSync(downloadedFilePath, { recursive: true });
    });
  });
});
