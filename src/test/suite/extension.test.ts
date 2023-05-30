import * as assert from "assert";
import * as vscode from "vscode";

import { downloadAddon } from "../../AddonDownload";
import { extractAddon } from "../../AddonExtract";
import { getAddonInfo } from "../../AddonInfo";

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
      // get path to test_workspace
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
      const addonSlug = "test-addon";
      const extractedworkspaceFolder = path.resolve(
        workspaceFolder,
        "test-addon"
      );
      await extractAddon(compressedFilePath, workspaceFolder, addonSlug);

      // check if extracted folder exists
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;

      // check if xpi file was removed
      expect(fs.existsSync(compressedFilePath)).to.be.false;

      // remove created folders
      fs.rmSync(extractedworkspaceFolder, { recursive: true });
    });

    describe("Addon Download", async () => {
      afterEach(() => {
        sinon.restore();
      });

      it("should download the xpi of the addon", async () => {
        // make a function that returns a fake response and passes it to downloadAddon
        const fakeResponse = {
          ok: true,
          buffer: () => {
            return "test data";
          },
        };

        const stub: sinon.SinonStub<any[], any> = sinon.stub();
        stub.resolves(fakeResponse);
        sinon.replace(fetch, "default", stub as any);

        // get the relative path to test_workspace
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

        for (let i = 0; i < 5; i++) {
          if (fs.existsSync(downloadedFilePath)) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        expect(fs.existsSync(downloadedFilePath)).to.be.true;

        fs.rmSync(downloadedFilePath, { recursive: true });
      });
    });
  });
});
