import { expect } from "chai";
import * as fs from "fs";
import { describe, it } from "mocha";
import path = require("path");

import {
  addToCache,
  getFromCache,
  clearCache,
} from "../../../src/utils/addonCache";

describe("addonCache.ts", async () => {
  describe("addToCache", async () => {
    it("should create the cache folder, file, and add data if it does not exist", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (fs.existsSync(storagePath)) {
        fs.rmSync(storagePath, { recursive: true });
      }

      await addToCache(storagePath, "test-guid", "test-key", "test-value");
      const cachePath = path.resolve(storagePath, ".cache");
      const filePath = path.resolve(cachePath, "test-guid.json");

      expect(fs.existsSync(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.true;
      expect(fs.existsSync(filePath)).to.be.true;

      const data = fs.readFileSync(filePath, "utf8");
      expect(data).to.equal(`{"test-key":"test-value"}`);

      fs.rmSync(storagePath, { recursive: true });
    });

    it("should modify the data in the cache file if it does exist", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath);
      }

      const cachePath = path.resolve(storagePath, ".cache");
      const filePath = path.resolve(cachePath, "test-guid.json");
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      await addToCache(storagePath, "test-guid", "test-key", "test-value-2");

      const data = fs.readFileSync(filePath, "utf8");
      expect(data).to.equal(`{"test-key":"test-value-2"}`);

      fs.rmSync(storagePath, { recursive: true });
    });
  });

  describe("getFromCache", async () => {
    it("should return undefined if the cache file does not exist", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (fs.existsSync(storagePath)) {
        fs.rmSync(storagePath, { recursive: true });
      }

      const result = await getFromCache(storagePath, "test-guid", "test-key");

      expect(result).to.be.undefined;
    });

    it("should return the data from the cache file if it does exist", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath);
      }

      const cachePath = path.resolve(storagePath, ".cache");
      const filePath = path.resolve(cachePath, "test-guid.json");
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }
      fs.writeFileSync(filePath, `{"test-key":"test-value"}`);

      const result = await getFromCache(storagePath, "test-guid", "test-key");

      expect(result).to.equal("test-value");

      fs.rmSync(storagePath, { recursive: true });
    });
  });

  describe("clearCache", async () => {
    it("should delete the cache folder and return true", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath);
      }

      const cachePath = path.resolve(storagePath, ".cache");
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }

      expect(await clearCache(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.false;
    });
  });
});
