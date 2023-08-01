import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { addonVersion } from "../../../amo/types";
import {
  getAddonVersions,
  getVersionChoice,
} from "../../../amo/utils/addonVersions";
import * as authUtils from "../../../amo/utils/requestAuth";
import constants from "../../../config/config";

describe("addonVersions.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    const authStub = sinon.stub(authUtils, "makeAuthHeader");
    authStub.resolves({ Authorization: "test" });
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

  describe("getVersionChoice()", () => {
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
  });

  describe("getPaginatedVersions()", () => {
    it("should retrieve the next page if there is one", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
            next: "next-page-url",
          };
        },
        ok: true,
      });
      stub.onCall(1).returns({
        json: () => {
          return {
            results: versions2,
          };
        },
        ok: true,
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

    it("should cancel if the user cancels the prompt", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        ok: false,
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Cancel" });

      try {
        await getAddonVersions("addon-slug-or-guid", "next-page-url");
        expect(true).to.equal(false);
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch versions");
      }
    });

    it("should restart the process if the user chooses to", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        ok: false,
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Fetch New Addon" });

      sinon.stub(vscode.commands, "executeCommand").resolves();

      try {
        await getAddonVersions("addon-slug-or-guid", "next-page-url");
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Process restarted");
      }
    });

    it("should try again if the user chooses to", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      stub.onCall(1).returns({
        json: () => {
          return {
            results: versions,
          };
        },
        ok: true,
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Try Again" });

      const res = await getAddonVersions("addon-slug-or-guid", "next-page-url");
      expect(res.results).to.be.an("array");
      expect(res.results).to.have.lengthOf(25);
    });
  });

  describe("getFirstVersions()", () => {
    it("should return a json if the input is a link", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
        ok: true,
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
        ok: true,
      });

      sinon.replace(fetch, "default", stub as any);

      const json = await getAddonVersions("addon-slug-or-guid");
      expect(json.results).to.be.an("array");
      expect(json.results).to.have.lengthOf(25);
    });

    it("should error if user cancels the error", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Cancel" });

      try {
        await getAddonVersions("addon-slug-or-guid");
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Failed to fetch addon");
      }
    });

    it("should restart if the user chooses to", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Fetch New Addon" });

      sinon.stub(vscode.commands, "executeCommand").resolves();

      try {
        await getAddonVersions("addon-slug-or-guid");
        expect(false).to.be.true;
      } catch (e: any) {
        expect(e.message).to.equal("Process restarted");
      }
    });

    it("should try again if the user chooses to", async () => {
      const stub = sinon.stub();
      stub.onCall(0).returns({
        json: () => {
          return {
            results: versions,
          };
        },
      });
      stub.onCall(1).returns({
        json: () => {
          return {
            results: versions,
          };
        },
        ok: true,
      });
      sinon.replace(fetch, "default", stub as any);

      const stub2 = sinon.stub(vscode.window, "showErrorMessage");
      stub2.onCall(0).resolves({ title: "Try Again" });

      const res = await getAddonVersions("addon-slug-or-guid");
      expect(res.results).to.be.an("array");
      expect(res.results).to.have.lengthOf(25);
    });
  });
});
