import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";

import { AddonCacheController } from "../../../src/controller/addonCacheController";
import { AssayCache } from "../../../src/model/assayCache";

let assayCacheStub: sinon.SinonStubbedInstance<AssayCache>;
let addonCacheController: AddonCacheController;

describe("addonCacheController.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    assayCacheStub = sinon.createStubInstance(AssayCache);
    addonCacheController = new AddonCacheController(assayCacheStub);
  });

  describe("addAddonToCache()", () => {
    it("should add a new addon's information to cache.", async () => {

        assayCacheStub.getFromCache.resolves();

        const rawReviewMeta = {
            reviewUrl: "url",
            version: "version",
            fileID: "file-id",
            id: "id",
            isDirty: false
        };

        await addonCacheController.addAddonToCache("test-guid", rawReviewMeta);

        expect(assayCacheStub.addToCache.calledWith(["test-guid"], {
            reviewUrl: "url",
            version: "version",
            fileIDs: {"version": "file-id"},
            id: "id"
        }));

    });

    it("should update an addon's information in cache.", async () => {
        assayCacheStub.getFromCache.resolves({
          reviewUrl: "url",
          version: "version",
          fileIDs: {"version": "file-id"},
          id: "id"
      });

      const rawReviewMeta = {
          reviewUrl: "url",
          version: "version-two",
          fileID: "file-id-two",
          id: "id",
          isDirty: false
      };

      await addonCacheController.addAddonToCache("test-guid", rawReviewMeta);

      expect(assayCacheStub.addToCache.calledWith(["test-guid"], {
          reviewUrl: "url",
          version: "version",
          fileIDs: {"version": "file-id", "version-two": "file-id-two"},
          id: "id"
      }));
    });

  });

  describe("getAddonFromCache()", () => {
    it("should return the result stored in cache.", async () => {
        await addonCacheController.getAddonFromCache(["keys"]);
        expect(assayCacheStub.getFromCache.calledWith(["keys"])).to.be.true;
    });
  });

});