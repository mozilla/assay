import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { addonInfoResponse } from "../../../amo/types";
import { getAddonInfo } from "../../../amo/utils/addonInfo";
import constants from "../../../config/config";

describe("AddonInfo.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  const expected: addonInfoResponse = {
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
    review_url: "fakeurl",
    guid: "gee you eye dee",
  };

  it("should return a json object of type addonInfoResponse if input is a slug", async () => {
    const input = "test-addon";
    const stub = sinon.stub();
    stub.resolves({
      ok: true,
      json: () => expected,
    });
    sinon.replace(fetch, "default", stub as any);

    const actual = await getAddonInfo(input);
    expect(actual).to.deep.equal(expected);
    expect(stub.calledOnce).to.be.true;
    expect(stub.calledWith(`${constants.apiBaseURL}addons/addon/${input}`)).to
      .be.true;
  });

  it("should return a json object of type addonInfoResponse if input is an id", async () => {
    const input = "123456";
    const stub = sinon.stub();
    stub.resolves({
      json: () => expected,
      ok: true,
    });
    sinon.replace(fetch, "default", stub as any);

    const actual = await getAddonInfo(input);
    expect(actual).to.deep.equal(expected);
    expect(stub.calledOnce).to.be.true;
    expect(stub.calledWith(`${constants.apiBaseURL}addons/addon/${input}`)).to
      .be.true;
  });

  it("should return a json object of type addonInfoResponse if input is a url", async () => {
    const input = "https://addons.mozilla.org/en-US/firefox/addon/test-addon";
    const stub = sinon.stub();
    stub.resolves({
      json: () => expected,
      ok: true,
    });
    sinon.replace(fetch, "default", stub as any);

    const actual = await getAddonInfo(input);
    expect(actual).to.deep.equal(expected);
    expect(stub.calledOnce).to.be.true;
    expect(
      stub.calledWith(`${constants.apiBaseURL}addons/addon/${expected.slug}`)
    ).to.be.true;
  });

  it("should throw an error if the response is not ok", async () => {
    const input = "test-addon";
    const stub = sinon.stub();
    stub.resolves({
      ok: false,
      json: () => expected,
    });
    sinon.replace(fetch, "default", stub as any);

    const stub2 = sinon.stub(vscode.window, "showErrorMessage");
    stub2.resolves({ title: "Cancel" });

    try {
      await getAddonInfo(input);
    } catch (e: any) {
      expect(e.message).to.equal("Failed to fetch addon info");
    }
  });
});
