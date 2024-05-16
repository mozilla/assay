import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { contextValues } from "../../../src/config/comment";
import { setExtensionStoragePath } from "../../../src/config/globals";
import * as addonCache from "../../../src/utils/addonCache";
import { createComment } from "../../../src/utils/comment";
import * as utilcmt from "../../../src/utils/comment";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";
import { deleteCommentFromCache, fetchCommentsFromCache, saveCommentToCache } from "../../../src/utils/storage";

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");
setExtensionStoragePath(storagePath);

const cmt = {
  uri: vscode.Uri.file(
    "test-root/test-guid/test-version/test-filepath"
  ),
  body: "test-comment",
  contextValue: "comment" as contextValues
};

const pos = new vscode.Position(1, 0);
const range = new vscode.Range(pos, pos);

describe("storage.ts", () => {
  beforeEach(() => {
    sinon.stub(reviewRootDir, "getRootFolderPath").resolves("/test-root");
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

  describe("fetchCommentsFromCache", () => {
    it("should fetch and create a comment from cache", async () => {
      sinon.stub(vscode.workspace, "workspaceFolders").get(() => [{uri: vscode.Uri.file("/test-root")}]);
      const getFromCacheStub = sinon.stub(addonCache, "getFromCache");
      const createCommentStub = sinon.stub(utilcmt, "createComment");
      getFromCacheStub.resolves({
      "1.2" : {
          "/test-filepath": {
          "#L1": cmt,
          }
        }
      });
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      await fetchCommentsFromCache(controller);
      expect(createCommentStub.called).to.be.true;
      expect(getFromCacheStub.called).to.be.true;
    });

    it("shouldn't create any comments if not in rootFolder", async () => {
      sinon.stub(vscode.workspace, "workspaceFolders").get(() => [{uri: vscode.Uri.file("/not-root")}]);
      const createCommentStub = sinon.stub(utilcmt, "createComment");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      await fetchCommentsFromCache(controller);
      expect(createCommentStub.called).to.be.false;
    });
  });

  describe("saveCommentToCache", () => {
    it("should save a comment to cache", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");
        const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
        const thread = controller.createCommentThread(cmt.uri, range, []);
        const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);
        await saveCommentToCache(comment);
        expect(addToCacheStub.called).to.be.true;
      });
  });

  describe("deleteCommentFromCache", () => {
    it("should delete a comment from cache", async () => {
      const addToCacheStub = sinon.stub(addonCache, "addToCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []);
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);
      await deleteCommentFromCache(comment);
      expect(addToCacheStub.called).to.be.true;
      });
  });
});
