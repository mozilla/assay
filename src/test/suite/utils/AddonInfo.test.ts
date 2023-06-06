import { getAddonInfo } from "../../../amo/utils/addonInfo";

import { AddonInfoResponse } from "../../../amo/interfaces";

import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as fetch from "node-fetch";

describe("AddonInfo.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

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
    review_url: "fakeurl",
    guid: "gee you eye dee",
  };

  it("should return a json object of type AddonInfoResponse if input is a slug", async () => {
    const input = "test-addon";
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.resolves({
      json: () => expected,
    });
    sinon.replace(fetch, "default", stub as any);

    const actual = await getAddonInfo(input);
    expect(actual).to.deep.equal(expected);
    expect(stub.calledOnce).to.be.true;
    expect(
      stub.calledWith(`https://addons.mozilla.org/api/v5/addons/addon/${input}`)
    ).to.be.true;
  });

  it("should return a json object of type AddonInfoResponse if input is an id", async () => {
    const input = "123456";
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.resolves({
      json: () => expected,
    });
    sinon.replace(fetch, "default", stub as any);

    const actual = await getAddonInfo(input);
    expect(actual).to.deep.equal(expected);
    expect(stub.calledOnce).to.be.true;
    expect(
      stub.calledWith(`https://addons.mozilla.org/api/v5/addons/addon/${input}`)
    ).to.be.true;
  });

  it("should return a json object of type AddonInfoResponse if input is a url", async () => {
    const input = "https://addons.mozilla.org/en-US/firefox/addon/test-addon";
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

  it("should throw an error if the response is not ok", async () => {
    expect(true).to.be.true; // TODO
  });
});
