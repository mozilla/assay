import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  addonInfoToCache,
  addonInfoFromCache,
} from "../../../amo/utils/addonCache";

describe("addonCache.ts", async () => {
  describe("addonInfoToCache", async () => {
    it("should create the cache folder and file if it does not exist", async () => {
      const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
      if (!fs.existsSync(workspaceFolder)) {
        fs.mkdirSync(workspaceFolder);
      }
      const storagePath = path.resolve(workspaceFolder, ".test_assay");
      if (fs.existsSync(storagePath)) {
        fs.rmSync(storagePath, { recursive: true });
      }

      await addonInfoToCache(
        storagePath,
        "test-guid",
        "test-key",
        "test-value"
      );
      const cachePath = path.resolve(storagePath, ".cache");
      const filePath = path.resolve(cachePath, "test-guid.json");

      expect(fs.existsSync(storagePath)).to.be.true;
      expect(fs.existsSync(cachePath)).to.be.true;
      expect(fs.existsSync(filePath)).to.be.true;

      const data = fs.readFileSync(filePath, "utf8");
      expect(data).to.equal(`{"test-key":"test-value"}`);

      fs.rmSync(storagePath, { recursive: true });
    });

    it("should add the data to the cache file if it does exist", async () => {
      //
    });

    it("should modify the data in the cache file if it does exist", async () => {
      //
    });
  });

  describe("addonInfoFromCache", async () => {
    it("should return undefined if the cache file does not exist", async () => {
      //
    });

    it("should return the data from the cache file if it does exist", async () => {
      //
    });
  });
});
