import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { getInput, downloadAndExtract } from "../../../src/commands/getAddon";
import * as addonInfo from "../../../src/utils/addonInfo";

describe("getAddon.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getInput()", () => {
    it("should return the input if provided.", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
      showInputBoxStub.onFirstCall().resolves("test");
      const result = await getInput();
      expect(result).to.equal("test");
    });

    it("should raise an error if no input is provided.", async () => {
      const showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
      showInputBoxStub.onFirstCall().resolves(undefined);
      try {
        await getInput();
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });
  });

  describe("downloadAndExtract()", () => {
    it("should use the guid parameter and not call getInput().", async () => {
      // stub getAddonInfo
      const getAddonInfoStub = sinon.stub(addonInfo, "getAddonInfo");
      getAddonInfoStub.resolves({
        id: "id",
        slug: "test-slug",
        name: {
          en_US: "Test Slug",
        },
        guid: "test-guid",
        review_url: "test-review-url",
        default_locale: "en_US",
        current_version: {
          version: "1.0",
          file: {
            id: "1",
          },
        },
      });

      await downloadAndExtract("test-guid");
      expect(getAddonInfoStub.calledWith("test-guid")).to.be.true;
    });
  });
});
