import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import constants from "../../../src/config/config";
import { addonVersion } from "../../../src/types";
import {
  getAddonVersions,
  getVersionChoice,
} from "../../../src/utils/addonVersions";
import * as authUtils from "../../../src/utils/requestAuth";

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
