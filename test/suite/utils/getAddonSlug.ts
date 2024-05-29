import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import getAddonSlug from "../../../src/utils/getAddonSlug";

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
  });
});
