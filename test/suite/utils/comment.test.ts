import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AssayReply, AssayThread, contextValues } from "../../../src/config/comment";
import { setExtensionStoragePath } from "../../../src/config/globals";
import { addComment, cancelSaveComment, createComment, deleteThread, editComment, saveComment } from "../../../src/utils/comment";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";
import * as storage from "../../../src/utils/storage";

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

describe("comment.ts", () => {

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

  describe("createComment", () => {
    it("should create a comment & comment thread", async () => {
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []);
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);

      expect(comment.body.value).to.be.equal(cmt.body);
      expect(comment.contextValue).to.be.equal(cmt.contextValue);
      expect(comment.thread).to.be.equal(thread);
      expect(comment.thread.comments.length).to.be.equal(1);
      expect(comment.thread.comments[0]).to.be.equal(comment);
    });
  });

  describe("addComment", async () => {
    it("should create a comment & comment thread from non-empty reply", async () => {
      const saveCommentToCacheStub = sinon.stub(storage, "saveCommentToCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const reply = new AssayReply(thread, cmt.body);

      expect(thread.comments.length).to.be.equal(0);
      await addComment(reply);
      expect(thread.comments.length).to.be.equal(1);
      expect(thread.comments[0].body.value).to.be.equal(cmt.body);
      expect(thread.comments[0].contextValue).to.be.equal(cmt.contextValue);
      expect(saveCommentToCacheStub.called).to.be.true;
    });

    it("should create a markForReview & comment thread from an empty reply", async () => {
      const saveCommentToCacheStub = sinon.stub(storage, "saveCommentToCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const reply = new AssayReply(thread, "");

      expect(thread.comments.length).to.be.equal(0);
      await addComment(reply);
      expect(thread.comments.length).to.be.equal(1);  
      expect(thread.comments[0].body.value).to.be.equal("Marked for review.");
      expect(thread.comments[0].contextValue).to.be.equal("markForReview");
      expect(saveCommentToCacheStub.called).to.be.true;
    });
  });

  describe("saveComment", () => {
    it("should update a comment's body to the new string", async () => {
      const saveCommentToCacheStub = sinon.stub(storage, "saveCommentToCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);

      const newBody = new vscode.MarkdownString("Hello, world!");

      expect(comment.body.value).to.be.equal(cmt.body);
      comment.body = newBody;
      await saveComment(comment);
      expect(comment.body.value).to.be.equal(newBody.value);
      expect(comment.contextValue).to.be.equal("comment");
      expect(saveCommentToCacheStub.called).to.be.true;
    });
    it("should take an empty string and populate it as marked", async () => {
      const saveCommentToCacheStub = sinon.stub(storage, "saveCommentToCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);

      const newBody = new vscode.MarkdownString("");

      expect(comment.body.value).to.be.equal(cmt.body);
      comment.body = newBody;
      await saveComment(comment);
      expect(comment.body.value).to.be.equal("Marked for review.");
      expect(comment.contextValue).to.be.equal("markForReview");
      expect(saveCommentToCacheStub.called).to.be.true;
    });
  });

  describe("cancelSaveComment", () => {
    it("should retain its original body text", async () => {
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);
      const newBody = new vscode.MarkdownString("Hello, world!");

      expect(comment.body.value).to.be.equal(cmt.body);
      comment.body = newBody;
      await cancelSaveComment(comment);
      expect(comment.body.value).to.be.equal(cmt.body);
      expect(comment.contextValue).to.be.equal("comment");
    });
  });

  describe("deleteThread()", () => {
    it("should delete the comment thread from a controller", async () => {
      const deleteCommentFromCacheStub = sinon.stub(storage, "deleteCommentFromCache");
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []);
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);

      const disposeStub = sinon.stub(comment.thread, "dispose");
      await deleteThread(comment.thread);
      expect(disposeStub.calledOnce).to.be.true;
      expect(deleteCommentFromCacheStub.called).to.be.true;
    });
  });

  describe("editComment", () => {
    it("should set a comment to edit mode", async () => {
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const comment = await createComment(cmt.contextValue, new vscode.MarkdownString(cmt.body), thread);
      expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
      expect(comment.body.value).to.be.equal(cmt.body);
      editComment(thread);
      expect(comment.body.value).to.be.equal(cmt.body);
      expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);
    });
  
    it("should clear the body if a markForReview comment", async () => {
      const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
      const thread = controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const comment = await createComment("markForReview", new vscode.MarkdownString(cmt.body), thread);
      expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
      expect(comment.body.value).to.be.equal(cmt.body);
      editComment(thread);
      expect(comment.body.value).to.be.equal("");
      expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);      
    });
  });
});


