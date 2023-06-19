import { expect } from "chai";
import exp = require("constants");
import { afterEach, describe, it } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { addonVersion } from "../../../amo/types";
import {
  getAddonVersions,
  getVersionChoice,
} from "../../../amo/utils/addonVersions";
import constants from "../../../config/config";

describe("addonVersions.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  const versions: addonVersion[] = [];
  for (let i = 0; i < 25; i++) {
    versions.push({
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
  const versions2: addonVersion[] = [];
  for (let i = 25; i < 30; i++) {
    versions2.push({
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

  describe("getVersionChoice", () => {
    it("should choose a version from the input slug", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub();
      stub2.onCall(0).returns("1");
      sinon.replace(vscode.window, "showQuickPick", stub2);

      getVersionChoice("addon-slug-or-guid").then((version) => {
        expect(version?.fileID).to.equal("1");
        expect(version?.version).to.equal("1");
      });
    });

    it("should paginate if there are more than 25 versions", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
            next: `${constants.apiBaseURL}addons/addon/versions/?page=2`,
          };
        },
      });
      stub.onCall(1).returns({
        json: () => {
          return {
            results: versions2,
          };
        },
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub();
      stub2.onCall(0).returns("More");
      stub2.onCall(1).returns("26");
      sinon.replace(vscode.window, "showQuickPick", stub2);

      getVersionChoice("addon-slug-or-guid").then((version) => {
        expect(version?.fileID).to.equal("26");
        expect(version?.version).to.equal("26");
      });
    });

    it("should error if no version is selected", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub();
      stub2.onCall(0).returns("");
      sinon.replace(vscode.window, "showQuickPick", stub2);

      try {
        await getVersionChoice("addon-slug-or-guid");
        expect.fail("Should have thrown an error");
      } catch (e: any) {
        expect(e.message).to.equal("No version choice selected");
      }
    });
  });

  describe("getAddonVersions", () => {
    it("should return a json if the input is a link", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });

      sinon.replace(fetch, "default", stub as any);

      const json = await getAddonVersions(
        `${constants.apiBaseURL}addons/addon/slug/versions/`
      );
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
    });

    it("should return a json if the input is a slug/guid", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });

      sinon.replace(fetch, "default", stub as any);

      const json = await getAddonVersions("addon-slug-or-guid");
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
    });

    it("should retrieve the next page if there is one", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
            next: "next-page-url",
          };
        },
      });
      stub.onCall(1).returns({
        json: () => {
          return {
            results: versions2,
          };
        },
      });

      sinon.replace(fetch, "default", stub as any);

      const json = await getAddonVersions("addon-slug-or-guid");
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
      expect(json.next).to.be.a("string");

      const json2 = await getAddonVersions("addon-slug-or-guid", json.next);
      expect(json2.results).to.be.an("array");
      expect(json2.results).to.have.lengthOf(5);
      expect(json2.next).to.be.undefined;
    });
  });
});
