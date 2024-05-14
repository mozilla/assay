import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import * as addonCache from "../../../src/utils/addonCache";
import * as lineComment from "../../../src/utils/lineComment";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

describe("deleteComment.ts", () => {
  afterEach(() => {
    sinon.restore();
  });
  // TODO
  // describe("removeCommentFromCurrentLine()", () => {
  //   it("should return undefined if there is no line info", async () => {
  //     sinon.stub(lineComment, "getLineInfo").returns(undefined);
  //     const result = await removeCommentFromCurrentLine();
  //     expect(result).to.be.undefined;
  //   });

  //   it("should add an empty string to cache and return true", async () => {
  //       const addToCacheStub = sinon.stub(addonCache, "addToCache");
  //       const rootFolderPathStub = sinon.stub(reviewRootDir, "getRootFolderPath");
  //       rootFolderPathStub.resolves("/root");
  //       sinon.stub(lineComment, "getLineInfo").returns({
  //           fullpath: "/root/test-guid/0.1.0/file",
  //           lineNumber: "1",
  //       });
  //       const result = await removeCommentFromCurrentLine();
  //       expect(result).to.be.true;
  //       expect(addToCacheStub.calledOnce).to.be.true;
  //       expect(addToCacheStub.calledWith("test-guid", ["0.1.0", "file", "1"], "")).to.be.true;
  //   });
  });
});
