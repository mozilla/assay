import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import * as addToCacheFunctions from "../../../src/utils/addonCache";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("makeComment.ts", async () => {
  afterEach(async () => {
    sinon.restore();
  });

  describe("getCommentHTML()", async () => {
    it("should return the correct HTML", async () => {
      // const guid = "test-guid";
      // const version = "test-version";
      // const filepath = "test-filepath";
      // const lineNumber = "test-lineNumber";
      // const existingComment = "test-existingComment";

      // const result = await getCommentHTML(
      //   guid,
      //   version,
      //   filepath,
      //   lineNumber,
      //   existingComment
      // );

      // expect(result).to.contain(guid);
      // expect(result).to.contain(version);
      // expect(result).to.contain(filepath);
      // expect(result).to.contain(lineNumber);
      // expect(result).to.contain(existingComment);
    });
  });

  describe("makeComment()", async () => {
    it("should return if there is no lineInfo", async () => {
      // const getLineInfoStub = sinon.stub(lineComment, "getLineInfo");
      // getLineInfoStub.returns(undefined);

      // const result = await makeComment();
      // expect(result).to.be.undefined;
    });

    it("should call makePanel() with the correct arguments", async () => {
      // const getLineInfoStub = sinon.stub(lineComment, "getLineInfo");
      // getLineInfoStub.returns({
      //   fullpath: "test-root-folder-path/test-guid/test-version/test-filepath",
      //   lineNumber: "test-lineNumber",
      // });

      // const getRootFolderPathStub = sinon.stub(
      //   reviewRootDir,
      //   "getRootFolderPath"
      // );
      // getRootFolderPathStub.resolves("test-root-folder-path");

      // const getFromCacheStub = sinon.stub(addToCacheFunctions, "getFromCache");
      // getFromCacheStub.resolves("test-existingComment");

      // await makeComment();

      // // Currently cannot stub makePanel or the webview efficiently

      // expect(getFromCacheStub.calledOnce).to.be.true;
      // expect(getFromCacheStub.args[0][0]).to.equal("test-guid");
      // expect(getFromCacheStub.args[0][1]).to.deep.equal([
      //   "test-version",
      //   "test-filepath",
      //   "test-lineNumber",
      // ]);
    });
  });
});
