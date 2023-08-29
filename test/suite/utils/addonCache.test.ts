import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";

import { setExtensionStoragePath } from "../../../src/config/globals";
import {
  addToCache,
  getFromCache,
  clearCache,
} from "../../../src/utils/addonCache";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");
const cachePath = path.resolve(storagePath, ".cache");
const filePath = path.resolve(cachePath, "test-guid.json");

describe("addonCache.ts", async () => {
  beforeEach(() => {
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
    it("should create the cache folder, file, and add data if it does not exist", async () => {
      setExtensionStoragePath(storagePath);

      await addToCache("test-guid", "test-key", "test-value");

      expect(fs.existsSync(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.true;
      expect(fs.existsSync(filePath)).to.be.true;

      const data = fs.readFileSync(filePath, "utf8");
      expect(data).to.equal(`{"test-key":"test-value"}`);
    });

    it("should modify the data in the cache file if it does exist", async () => {
      setExtensionStoragePath(storagePath);

      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      await addToCache("test-guid", "test-key", "test-value-2");

      const data = fs.readFileSync(filePath, "utf8");
      expect(data).to.equal(`{"test-key":"test-value-2"}`);
    });
  });

  describe("getFromCache()", async () => {
    it("should return undefined if the cache file does not exist", async () => {
      const result = await getFromCache(storagePath, "test-guid", "test-key");
      expect(result).to.be.undefined;
    });

    it("should return the data from the cache file if it does exist", async () => {
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      const result = await getFromCache(storagePath, "test-guid", "test-key");

      expect(result).to.equal("test-value");
    });
  });

  describe("clearCache()", async () => {
    it("should delete the cache folder and return true", async () => {
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }

      expect(await clearCache(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.false;
    });
  });
});
