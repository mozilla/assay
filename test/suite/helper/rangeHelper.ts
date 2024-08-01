import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { RangeHelper } from "../../../src/helper/rangeHelper";

const pos = new vscode.Position(1, 0);
const pos2 = new vscode.Position(5, 0);
const rng = new vscode.Range(pos, pos);
const multiRng = new vscode.Range(pos2, pos);

describe("rangeHelper.ts", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("fromNumber()", function () {
    it("should create a Range from numbers.", function () {
      const start = 5;
      const end = 10;
      const endCharacter = 15;
      const range = RangeHelper.fromNumber(start, end, endCharacter);
      expect(range.start).to.deep.equal(new vscode.Position(start, 0));
      expect(range.end).to.deep.equal(new vscode.Position(end, endCharacter));
    });
  });

  describe("fromSelection()", function () {
    it("should create a Range from a vscode Selection.", function () {
      const selection = new vscode.Selection(5, 10, 15, 20);
      const endCharacter = 15;

      const range = RangeHelper.fromSelection(selection, endCharacter);
      expect(range.start).to.deep.equal(
        new vscode.Position(selection.start.line, 0)
      );
      expect(range.end).to.deep.equal(
        new vscode.Position(selection.end.line, endCharacter)
      );
    });
  });

  describe("toString()", () => {
    it("should convert a single-line range correctly.", async () => {
      const range = RangeHelper.toString(rng);
      expect(range).to.equal("#L1");
    });

    it("should convert a multi-line range correctly.", async () => {
      const range = RangeHelper.toString(multiRng);
      expect(range).to.equal("#L1-5");
    });
  });

  describe("fromString()", () => {
    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#L1-";
      try {
        const result = await RangeHelper.fromString(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L1-");
      }
    });

    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#L-23";
      try {
        const result = await RangeHelper.fromString(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L-23");
      }
    });

    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#l1-2";
      try {
        const result = await RangeHelper.fromString(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #l1-2");
      }
    });

    it("should reject a string with no numbers.", async () => {
      const str = "#L-";
      try {
        const result = await RangeHelper.fromString(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L-");
      }
    });

    it("should correctly return a single-line range.", async () => {
      const str = "#L1";
      const result = await RangeHelper.fromString(str);
      expect(result).to.deep.equal(rng);
    });
    it("should correctly return a multi-line range.", async () => {
      const str = "#L1-5";
      const result = await RangeHelper.fromString(str);
      expect(result).to.deep.equal(multiRng);
    });
  });

  describe("truncate()", () => {
    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#L1-";
      try {
        const result = RangeHelper.truncate(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L1-");
      }
    });

    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#L-23";
      try {
        const result = RangeHelper.truncate(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L-23");
      }
    });

    it("should reject an incorrectly-formatted string.", async () => {
      const str = "#l1-2";
      try {
        const result = RangeHelper.truncate(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #l1-2");
      }
    });

    it("should reject a string with no numbers.", async () => {
      const str = "#L-";
      try {
        const result = RangeHelper.truncate(str);
        expect(result).to.be.empty;
      } catch (e: any) {
        expect(e.message).to.equal("Passed string is not a line number: #L-");
      }
    });

    it("should correctly adjust a single-line range.", async () => {
      const str = "#L1";
      const result = RangeHelper.truncate(str);
      expect(result).to.equal("#L2");
    });
    it("should correctly adjust a multi-line range.", async () => {
      const str = "#L1-5";
      const result = RangeHelper.truncate(str);
      expect(result).to.equal("#L2-6");
    });
  });
});
