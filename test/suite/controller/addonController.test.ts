import { expect } from "chai";
import * as fs from "fs";
import * as jszip from "jszip";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import constants from "../../../src/config/config";
import { AddonCacheController } from "../../../src/controller/addonCacheController";
import { AddonController } from "../../../src/controller/addonController";
import { CredentialController } from "../../../src/controller/credentialController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { SidebarController } from "../../../src/controller/sidebarController";
import { AddonInfoResponse, AddonVersion, QPOption } from "../../../src/types";

const populateVersion = (version: AddonVersion[], start: number, end: number) => {
  for (let i = start; i < end; i++) {
    version.push({
      version: i.toString(),
      id: i.toString(),
      file: {
        id: i.toString(),
      },
      map(
        arg0: (version: any) => any
      ): readonly string[] | Thenable<readonly string[]> {
        throw new Error("Method not implemented.");
      },
    });
  }
};

const createXPI = async () => {
  const zip = new jszip();
  zip.file("test.txt", "test data inside txt");
  await zip.generateAsync({ type: "nodebuffer" }).then((content) => {
    fs.writeFileSync(compressedFilePath, content);
  });
};

const addonSlug = "test-addon";
const addonVersion = "1.0.0";
const addonId = "123456";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const addonUrl = `https://addons.mozilla.org/en-US/firefox/addon/${addonSlug}`;
const downloadedFilePath = path.resolve(workspaceFolder, `${addonSlug}.xpi`);
const compressedFilePath = path.resolve(workspaceFolder, "test-addon.xpi");
const extractedworkspaceFolder = path.resolve(workspaceFolder, addonSlug);
const extractedVersionFolder = path.resolve(
  addonVersion
);

const firstVersions: AddonVersion[] = [];
const secondVersions: AddonVersion[] = [];

populateVersion(firstVersions, 0, 25);
populateVersion(secondVersions, 25, 30);

const expected: AddonInfoResponse = {
  id: "id",
  slug: addonSlug,
  name: {
    en: "Test addon",
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  current_version: {
    version: "1.0.0",
    file: {
      id: "100100",
    },
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  default_locale: "en",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  review_url: "fakeurl",
  guid: "guid@firebird.com",
};

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

let credentialControllerStub: sinon.SinonStubbedInstance<CredentialController>,
addonCacheControllerStub: sinon.SinonStubbedInstance<AddonCacheController>,
directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>,
sidebarControllerStub;

let addonController: AddonController;

describe("addonController.ts", async () => {

  beforeEach(async () => {

    credentialControllerStub = sinon.createStubInstance(CredentialController);
    credentialControllerStub.makeAuthHeader.resolves({ Authorization: "test" });
    addonCacheControllerStub = sinon.createStubInstance(AddonCacheController);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    sidebarControllerStub = {refresh: () => undefined} as SidebarController;

    addonController = new AddonController(credentialControllerStub, addonCacheControllerStub, directoryControllerStub, sidebarControllerStub);

    if (!fs.existsSync(workspaceFolder)) {
      fs.promises.mkdir(workspaceFolder);
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

  describe("getAddonVersions()", () => {
    it("should return a json if the input is a link.", async () => {
      const fetchStub = sinon.stub();
      sinon.replace(fetch, "default", fetchStub as any);
      
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
          };
        },
        ok: true,
    });
      

    const json = await addonController.getAddonVersions(
      `${constants.apiBaseURL}addons/addon/slug/versions/`
    );
    expect(json.results).to.be.an("array");
    expect(json.results).to.have.lengthOf(25);
  });

    it("should return a json if the input is a slug/guid.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
          };
        },
        ok: true,
      });
      sinon.replace(fetch, "default", fetchStub as any);

      const json = await addonController.getAddonVersions("addon-slug-or-guid");
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
    });

    it("should error if user cancels the error.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
          };
        },
      });
      sinon.replace(fetch, "default", fetchStub as any);

      const showErrorMessageStub = sinon.stub(
        vscode.window,
        "showErrorMessage"
      );
      showErrorMessageStub.onCall(0).resolves({ title: "Cancel" });

      try {
        await addonController.getAddonVersions("addon-slug-or-guid");
        
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch versions");
      }
    });
  });

  describe("downloadAndExtract()", () => {
    it("should use the guid parameter and not call getInput().", async () => {
      
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns(QPOption.No);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const versionChoiceStub = sinon.stub(addonController, "getVersionChoice");
      versionChoiceStub.resolves({fileID: "1", version: "1.0"});
      sinon.stub(addonController, <any>"downloadAddon");

      const getAddonInfoStub = sinon.stub(addonController, <any>"getAddonInfo");
      getAddonInfoStub.resolves({
        id: "id",
        slug: "test-slug",
        name: {
          en_US: "Test Slug",
        },
        guid: "test-guid",
        review_url: "test-review-url",
        default_locale: "en_US",
        current_version: {
          version: "1.0",
          file: {
            id: "1",
          },
        },
      });
      await addonController.downloadAndExtract("test-guid");
      expect(getAddonInfoStub.calledWith("test-guid")).to.be.true;
    });
  });

  describe("getVersionChoice()", () => {

    it("should retrieve the next page and be able to select something from that page.", async () => {
      const fetchStub = sinon.stub(addonController, "getAddonVersions");
      fetchStub.onCall(0).resolves({
            results: firstVersions,
            next: "next-page-url",
            });
      fetchStub.onCall(1).resolves({
            results: secondVersions
            });

      sinon.replace(fetch, "default", fetchStub as any);

      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("More");
      showQuickPickStub.onCall(1).returns("25");

      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      const result = await addonController.getVersionChoice("addon-slug-or-guid");
      expect(result.fileID).to.equal("25");
      expect(result.version).to.equal("25");

    });

    it("should error if the user cancels the prompt.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        ok: false,
      });
      sinon.replace(fetch, "default", fetchStub as any);

      const showErrorMessageStub = sinon.stub(
        vscode.window,
        "showErrorMessage"
      );
      showErrorMessageStub.onCall(0).resolves({ title: "Cancel" });

      try {
        await addonController.getAddonVersions("addon-slug-or-guid", "next-page-url");
        expect(true).to.equal(false);
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch versions");
      }
    });
  });

   describe("getAddonInfo()", () => {

    it("should return a json object of type addonInfoResponse if input is a slug.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: true,
        json: () => expected,
      });
      sinon.replace(fetch, "default", fetchStub as any);
  
      const actual = await (addonController as any).getAddonInfo(addonSlug);
      expect(actual).to.deep.equal(expected);
      expect(fetchStub.calledOnce).to.be.true;
      expect(
        fetchStub.calledWith(`${constants.apiBaseURL}addons/addon/${addonSlug}`)
      ).to.be.true;
    });
  
    it("should return a json object of type addonInfoResponse if input is an id.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        json: () => expected,
        ok: true,
      });
      sinon.replace(fetch, "default", fetchStub as any);
  
      const actual = await (addonController as any).getAddonInfo(addonId);
      expect(actual).to.deep.equal(expected);
      expect(fetchStub.calledOnce).to.be.true;
      expect(
        fetchStub.calledWith(`${constants.apiBaseURL}addons/addon/${addonId}`)
      ).to.be.true;
    });
  
    it("should return a json object of type addonInfoResponse if input is a url.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        json: () => expected,
        ok: true,
      });
      sinon.replace(fetch, "default", fetchStub as any);
  
      const actual = await (addonController as any).getAddonInfo(addonUrl);
      expect(actual).to.deep.equal(expected);
      expect(fetchStub.calledOnce).to.be.true;
      expect(
        fetchStub.calledWith(
          `${constants.apiBaseURL}addons/addon/${expected.slug}`
        )
      ).to.be.true;
    });
  
    it("should throw an error if the response is not ok.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves({
        ok: false,
        json: () => expected,
      });
      sinon.replace(fetch, "default", fetchStub as any);
  
      const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
      showErrorMessageStub.resolves({ title: "Cancel" });
  
      try {
        await (addonController as any).getAddonInfo(addonSlug);
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch addon info");
      }
    });
  });

  describe("downloadAddon()", async () => {

    it("should download the xpi of the addon.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves(goodResponse);
      sinon.replace(fetch, "default", fetchStub as any);

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.onFirstCall().returns(true);

      await (addonController as any).downloadAddon(addonId, downloadedFilePath);
      sinon.restore();

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to.be
        .true;

      // wait for file to be written (there should be a better way to do this)
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(fs.existsSync(downloadedFilePath)).to.be.true;
    });

    it("should not make a file if the request failed.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves(badResponse);
      sinon.replace(fetch, "default", fetchStub as any);

      const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
      showErrorMessageStub.resolves({ title: "Cancel" });

      try {
        await (addonController as any).downloadAddon(addonId, downloadedFilePath);
      } catch (e: any) {
        expect(e.message).to.equal("Download request failed");
        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.calledWith(`${constants.downloadBaseURL}${addonId}`)).to
          .be.true;

        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(fs.existsSync(downloadedFilePath)).to.be.false;
      }
    });

    it("should throw an error if the user cancels.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.resolves(goodResponse);
      sinon.replace(fetch, "default", fetchStub as any);

      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.onFirstCall().returns(false);
      existsSyncStub.onSecondCall().returns(true);

      const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
      showErrorMessageStub.resolves({ title: "Cancel" });

      try {
        await (addonController as any).downloadAddon(addonId, downloadedFilePath);
      } catch (e: any) {
        expect(e.message).to.equal("Download failed");
      }
    });
  });

  describe("extractAddon()", async () => {

    beforeEach(async () => {
      await createXPI();
    });

    it("should extract a new addon and remove the xpi.", async () => {

      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns(QPOption.Yes);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      await (addonController as any).extractAddon(
        compressedFilePath,
        extractedVersionFolder
      );

      expect(fs.existsSync(extractedVersionFolder)).to.be.true;
      expect(fs.existsSync(compressedFilePath)).to.be.false;

    });

    it("should overwrite an existing addon.", async () => {
      fs.promises.mkdir(extractedworkspaceFolder);
      fs.promises.mkdir(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say yes
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns(QPOption.Yes);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      await (addonController as any).extractAddon(
        compressedFilePath,
        extractedVersionFolder
      );

      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(fs.existsSync(extractedVersionFolder)).to.be.true;
      expect(fs.existsSync(compressedFilePath)).to.be.false;
      
      const fileStats = fs.statSync(
        path.resolve(extractedVersionFolder, "test.txt")
      );
      // expect(fileStats.mode).to.equal(0o100444);

      const fileContent = fs.readFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "utf-8"
      );
      expect(fileContent).to.equal("test data inside txt");
    });

    it("should not overwrite an existing addon.", async () => {
      fs.promises.mkdir(extractedworkspaceFolder);
      fs.promises.mkdir(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say no
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns(QPOption.No);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      try {
        await (addonController as any).extractAddon(
          compressedFilePath,
          extractedVersionFolder
        );
        
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

    it("should error if the user cancels the vscode error.", async () => {
      if (!fs.existsSync(workspaceFolder)) {
        fs.promises.mkdir(workspaceFolder);
      }

      await createXPI();

      const stub = sinon.stub(fs, "existsSync");
      stub.returns(false);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Cancel" });

      try {
        await (addonController as any).extractAddon(
          compressedFilePath,
          extractedVersionFolder
        );
        
      } catch (e: any) {
        expect(e.message).to.equal("Extraction failed.");
      }
    });
  });

  describe("dirExistsOrMake()", async () => {
    it("should create a directory if it does not exist.", async () => {
      const res = await (addonController as any).dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.true;
    });

    it("should not create a directory if it exists.", async () => {
      await fs.promises.mkdir(extractedworkspaceFolder);
      const res = await (addonController as any).dirExistsOrMake(extractedworkspaceFolder);
      expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
      expect(res).to.be.false;
    });
  });

  describe("getAddonSlug()", () => {
    it("should correctly return the AMO ID from a review url", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review/128";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("128");
    });

    it("should correctly return the AMO ID from a review url with nonsense afterward", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review/128/alot/of/nonsense";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("128");
    });

    it("should correctly return the AMO ID from an unlisted review url", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review-unlisted/256";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("256");
    });

    it("should correctly return the AMO ID from an unlisted review url with nonsense afterward", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review-unlisted/256/alot/of/nonsense";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("256");
    });

    it("should correctly return the slug from a addons url", async () => {
        const url = "https://addons.mozilla.org/en-US/firefox/addon/adblock-plus";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("adblock-plus");
    });

    it("should correctly return the slug from a addons url with nonsense afterward", async () => {
        const url = "https://addons.mozilla.org/en-US/firefox/addon/adblock-plus/alot/of/nonsense";
        const result = (addonController as any).getAddonSlug(url);
        expect(result).to.equal("adblock-plus");
    });

    it("should just return the input if no delimiter is identified, regardless of whether it really is a slug or not.", () => {
      const url = "nonsense-or-slug";
      const result = (addonController as any).getAddonSlug(url);
      expect(result).to.equal("nonsense-or-slug");
    });
    
  });

});
