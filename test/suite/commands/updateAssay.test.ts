import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  updateAssay,
  checkAndGetNewVersion,
  installNewVersion,
  downloadVersion,
} from "../../../src/commands/updateAssay";

describe("updateAssay.ts", () => {
  afterEach(() => {
    sinon.restore();
  });
  
  describe("updateAssay()", () => {});

  describe("checkAndGetNewVersion()", () => {});

  describe("installNewVersion()", () => {});

  describe("downloadVersion()", () => {});
});
