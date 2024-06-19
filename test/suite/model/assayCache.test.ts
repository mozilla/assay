import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";

import { AssayCache } from "../../../src/model/assayCache";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");
const cachePath = path.resolve(storagePath, ".cache");
const filePath = path.resolve(cachePath, "test-cache.json");

let cache: AssayCache;

describe("addonCache.ts", async () => {
  beforeEach(() => {

    cache = new AssayCache("test-cache", storagePath);

    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder);
    }
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath);
    }
  });

  afterEach(async () => {
    sinon.restore();
    if (fs.existsSync(workspaceFolder)) {
      await fs.promises.rm(workspaceFolder, { recursive: true });
    }
  });

  describe("addToCache()", async () => {
    it("should create the cache folder, file, and add data if it does not exist.", async () => {

      await cache.addToCache(["test-key"], "test-value");

      expect(fs.existsSync(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.true;
      expect(fs.existsSync(filePath)).to.be.true;

      const json = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(json);
      expect(data).to.deep.equal({ "test-key": "test-value" });
    });

    it("should modify the data in the cache file if it does exist.", async () => {

      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      await cache.addToCache(["test-key"], "test-value-2");

      const json = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(json);
      expect(data).to.deep.equal({ "test-key": "test-value-2" });
    });
  });

  describe("getFromCache()", async () => {
    it("should return undefined if the cache file does not exist.", async () => {
      const result = await cache.getFromCache(["test-key"]);
      expect(result).to.be.undefined;
    });

    it("should return the data from the cache file if it does exist.", async () => {
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      const result = await cache.getFromCache(["test-key"]);

      expect(result).to.equal("test-value");
    });
  });

  describe("clearCache()", async () => {
    it("should delete the cache folder and return true.", async () => {
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }

      expect(await cache.clearCache()).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.false;
    });
  });

  describe("removeEmptyObjectsFromCache()", async () => {
    it("should remove empty objects from the cache.", async () => {
      // all of this should be deleted since there is no actual data, just keys
      await cache.addToCache(["test-key", "test-key-2", "test-key-3"], "");

      expect(fs.existsSync(filePath)).to.be.true;

      const json = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(json);
      expect(data).to.deep.equal({});
    });

    
  });
});
