import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";

import { AddonCacheController } from "../../../src/controller/addonCacheController";
import { AddonController } from "../../../src/controller/addonController";
import { CredentialController } from "../../../src/controller/credentialController";
import { DirectoryController } from "../../../src/controller/directoryController";


let credentialControllerStub: CredentialController, addonCacheControllerStub: AddonCacheController, directoryControllerStub: DirectoryController;
let addonController: AddonController;

describe("getAddon.ts", async () => {

  beforeEach(() => {

    credentialControllerStub = sinon.createStubInstance(CredentialController);
    addonCacheControllerStub = sinon.createStubInstance(AddonCacheController);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);

    addonController = new AddonController(credentialControllerStub, addonCacheControllerStub, directoryControllerStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("downloadAndExtract()", () => {
    it("should use the guid parameter and not call getInput().", async () => {
      
      const getAddonInfoStub = sinon.stub(AddonController.prototype, "getAddonInfo");
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


});


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

  it("should download the xpi of the addon.", async () => {
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

  it("should not make a file if the request failed.", async () => {
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
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Download failed");
    }
  });
});

import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

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

  it("should download the xpi of the addon.", async () => {
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

  it("should not make a file if the request failed.", async () => {
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
      await downloadAddon(addonId, downloadedFilePath);
      expect(false).to.be.true;
    } catch (e: any) {
      expect(e.message).to.equal("Download failed");
    }
  });
});

import { expect } from "chai";
import * as fs from "fs";
import * as jszip from "jszip";
import { afterEach, describe, it, beforeEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { extractAddon } from "../../../src/controller/addonController";
import { QPOption } from "../../../src/types";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const compressedFilePath = path.resolve(workspaceFolder, "test-addon.xpi");
const addonGUID = "test-addon";
const addonVersion = "1.0.0";
const extractedworkspaceFolder = path.resolve(workspaceFolder, addonGUID);
const extractedVersionFolder = path.resolve(
  
  addonVersion
);

async function createXPI() {
  const zip = new jszip();
  zip.file("test.txt", "test data inside txt");
  await zip.generateAsync({ type: "nodebuffer" }).then((content) => {
    fs.writeFileSync(compressedFilePath, content);
  });
}

describe("AddonExtract.ts", async () => {
  beforeEach(async () => {
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }
    await createXPI();
  });

  afterEach(() => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      fs.rmSync(workspaceFolder, { recursive: true });
    }
  });

  describe("extractAddon()", async () => {
    it("should extract a new addon, remove the xpi, and make files read only.", async () => {
      await extractAddon(
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
    });

    it("should overwrite an existing addon.", async () => {
      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

      // create a file in the version folder
      fs.writeFileSync(
        path.resolve(extractedVersionFolder, "test.txt"),
        "replace me"
      );

      // make a stub for the quickpick and force it to say yes
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns(QPOption.Yes);
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      await extractAddon(
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
      fs.mkdirSync(extractedworkspaceFolder);
      fs.mkdirSync(extractedVersionFolder);

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
        await extractAddon(
          compressedFilePath,
          extractedVersionFolder
        );
        expect(false).to.be.true;
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
        fs.mkdirSync(workspaceFolder);
      }

      await createXPI();

      const stub = sinon.stub(fs, "existsSync");
      stub.returns(false);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Cancel" });

      try {
        await extractAddon(
          compressedFilePath,
          extractedVersionFolder
        );
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Extraction failed");
      }
    });
  });

  // describe("dirExistsOrMake()", async () => {
  //   it("should create a directory if it does not exist.", async () => {
  //     const res = await dirExistsOrMake(extractedworkspaceFolder);
  //     expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
  //     expect(res).to.be.true;
  //   });

  //   it("should not create a directory if it exists.", async () => {
  //     fs.mkdirSync(extractedworkspaceFolder);

  //     const res = await dirExistsOrMake(extractedworkspaceFolder);
  //     expect(fs.existsSync(extractedworkspaceFolder)).to.be.true;
  //     expect(res).to.be.undefined;
  //   });
  // });
});

import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import constants from "../../../src/config/config";
import { addonInfoResponse } from "../../../src/types";
import * as authUtils from "../../../src/utils/requestAuth";

const addonSlug = "test-addon";
const addonId = "123456";
const addonUrl = `https://addons.mozilla.org/en-US/firefox/addon/${addonSlug}`;
const expected: addonInfoResponse = {
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

describe("AddonInfo.ts", () => {
  beforeEach(() => {
    const authStub = sinon.stub(authUtils, "makeAuthHeader");
    authStub.resolves({ Authorization: "test" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return a json object of type addonInfoResponse if input is a slug.", async () => {
    const fetchStub = sinon.stub();
    fetchStub.resolves({
      ok: true,
      json: () => expected,
    });
    sinon.replace(fetch, "default", fetchStub as any);

    const actual = await getAddonInfo(addonSlug);
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

    const actual = await getAddonInfo(addonId);
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

    const actual = await getAddonInfo(addonUrl);
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
      await getAddonInfo(addonSlug);
    } catch (e: any) {
      expect(e.message).to.equal("Failed to fetch addon info");
    }
  });
});


import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import constants from "../../../src/config/config";
import { getAddonVersions } from "../../../src/controller/addonController";
import { addonVersion } from "../../../src/types";
import * as authUtils from "../../../src/utils/requestAuth";
import { getVersionChoice } from "../../../src/views/addonView";

const firstVersions: addonVersion[] = [];
for (let i = 0; i < 25; i++) {
  firstVersions.push({
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

const secondVersions: addonVersion[] = [];
for (let i = 25; i < 30; i++) {
  secondVersions.push({
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

describe("addonVersions.ts", () => {
  beforeEach(() => {
    const authStub = sinon.stub(authUtils, "makeAuthHeader");
    authStub.resolves({ Authorization: "test" });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getVersionChoice()", () => {
    it("should choose a version from the input slug.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
          };
        },
      });
      sinon.replace(fetch, "default", fetchStub as any);

      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("1");
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      getVersionChoice("addon-slug-or-guid").then((version) => {
        expect(version?.fileID).to.equal("1");
        expect(version?.version).to.equal("1");
      });
    });

    it("should pick the version from the input parameter.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
          };
        },
      });
      sinon.replace(fetch, "default", fetchStub as any);

      const showQuickPickStub = sinon.stub();
      showQuickPickStub.onCall(0).returns("1");
      sinon.replace(vscode.window, "showQuickPick", showQuickPickStub);

      getVersionChoice("addon-slug-or-guid", "2").then((version) => {
        expect(version?.fileID).to.equal("2");
        expect(version?.version).to.equal("2");
      });
    });
  });

  describe("getPaginatedVersions()", () => {
    it("should retrieve the next page if there is one.", async () => {
      const fetchStub = sinon.stub();
      fetchStub.onCall(0).returns({
        json: () => {
          return {
            results: firstVersions,
            next: "next-page-url",
          };
        },
        ok: true,
      });
      fetchStub.onCall(1).returns({
        json: () => {
          return {
            results: secondVersions,
          };
        },
        ok: true,
      });

      sinon.replace(fetch, "default", fetchStub as any);

      const json = await getAddonVersions("addon-slug-or-guid");
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
      expect(json.next).to.be.a("string");

      const json2 = await getAddonVersions("addon-slug-or-guid", json.next);
      expect(json2.results).to.be.an("array");
      expect(json2.results).to.have.lengthOf(5);
      expect(json2.next).to.be.undefined;
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
        await getAddonVersions("addon-slug-or-guid", "next-page-url");
        expect(true).to.equal(false);
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch versions");
      }
    });
  });

  describe("getFirstVersions()", () => {
    it("should return a json if the input is a link.", async () => {
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

      const json = await getAddonVersions(
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

      const json = await getAddonVersions("addon-slug-or-guid");
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
        await getAddonVersions("addon-slug-or-guid");
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch versions");
      }
    });
  });
});

import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import getAddonSlug from "../../../src/controller/addonController";

describe("getAddonSlug.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getAddonSlug()", () => {
    it("should correctly return the AMO ID from a review url", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review/128";
        const result = getAddonSlug(url);
        expect(result).to.equal("128");
    });

    it("should correctly return the AMO ID from a review url with nonsense afterward", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review/128/alot/of/nonsense";
        const result = getAddonSlug(url);
        expect(result).to.equal("128");
    });

    it("should correctly return the AMO ID from an unlisted review url", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review-unlisted/256";
        const result = getAddonSlug(url);
        expect(result).to.equal("256");
    });

    it("should correctly return the AMO ID from an unlisted review url with nonsense afterward", async () => {
        const url = "https://reviewers.addons.mozilla.org/en-US/reviewers/review-unlisted/256/alot/of/nonsense";
        const result = getAddonSlug(url);
        expect(result).to.equal("256");
    });

    it("should correctly return the slug from a addons url", async () => {
        const url = "https://addons.mozilla.org/en-US/firefox/addon/adblock-plus";
        const result = getAddonSlug(url);
        expect(result).to.equal("adblock-plus");
    });

    it("should correctly return the slug from a addons url with nonsense afterward", async () => {
        const url = "https://addons.mozilla.org/en-US/firefox/addon/adblock-plus/alot/of/nonsense";
        const result = getAddonSlug(url);
        expect(result).to.equal("adblock-plus");
    });

it("should just return the input if no delimiter is identified, regardless of whether it really is a slug or not.", () => {
  const url = "nonsense-or-slug";
  const result = getAddonSlug(url);
  expect(result).to.equal("nonsense-or-slug");
});
  });
});
