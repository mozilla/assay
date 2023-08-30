import { expect } from "chai";
import { afterEach, describe, it, beforeEach } from "mocha";
import * as fetch from "node-fetch";
import * as sinon from "sinon";
import * as vscode from "vscode";

import constants from "../../../src/config/config";
import { addonInfoResponse } from "../../../src/types";
import { getAddonInfo } from "../../../src/utils/addonInfo";
import * as authUtils from "../../../src/utils/requestAuth";

const addonSlug = "test-addon";
const addonId = "123456";
const addonUrl = `https://addons.mozilla.org/en-US/firefox/addon/${addonSlug}`;
const expected: addonInfoResponse = {
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

  it("should return a json object of type addonInfoResponse if input is a slug", async () => {
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

  it("should return a json object of type addonInfoResponse if input is an id", async () => {
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

  it("should return a json object of type addonInfoResponse if input is a url", async () => {
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

  it("should throw an error if the response is not ok", async () => {
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
