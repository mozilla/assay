import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AssayReply, AssayThread, contextValues } from "../../../src/config/comment";
import { setExtensionStoragePath } from "../../../src/config/globals";
import * as addonCache from "../../../src/utils/addonCache";
import { CommentManager } from "../../../src/utils/commentManager";
import * as loadFileDecorator from "../../../src/utils/loadFileDecorator";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";

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

describe("CommentManager.ts", () => {

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

  describe("addComment", async () => {
    it("should create a comment & thread from non-empty reply and save the comment to cache.", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");

        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);

        // was created, and correctly
        expect(thread.comments.length).to.be.equal(0);
        await cmtManager.addComment(reply);
        expect(thread.comments.length).to.be.equal(1);

        const comment = thread.comments[0];
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.contextValue).to.be.equal(cmt.contextValue);
        expect(comment.thread).to.be.equal(thread);
        expect(comment.thread.comments.length).to.be.equal(1);
        expect(comment.thread.comments[0]).to.be.equal(comment);

        // was added to cache
        expect(addToCacheStub.called).to.be.true;
    });

    it("should create a markForReview & comment thread from an empty reply.", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, "");

        // was created
        expect(thread.comments.length).to.be.equal(0);
        await cmtManager.addComment(reply);
        expect(thread.comments.length).to.be.equal(1);  
        expect(thread.comments[0].body.value).to.be.equal("Marked for review.");
        expect(thread.comments[0].contextValue).to.be.equal("markForReview");

        // was added to cache
        expect(addToCacheStub.called).to.be.true;
    });
  });

  describe("saveComment", () => {
    it("should update a comment's body to the new string both in comment and in cache.", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");

        const newBody = new vscode.MarkdownString("Hello, world!");
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtManager.addComment(reply);

        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtManager.saveComment(comment);
        expect(comment.body.value).to.be.equal(newBody.value);
        expect(comment.contextValue).to.be.equal("comment");
        
        // was added to cache
        expect(addToCacheStub.called).to.be.true;
    });
    it("should take an empty string and populate it as marked.", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");

        const newBody = new vscode.MarkdownString("");
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtManager.addComment(reply);


        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtManager.saveComment(comment);
        expect(comment.body.value).to.be.equal("Marked for review.");
        expect(comment.contextValue).to.be.equal("markForReview");
        
        // was added to cache
        expect(addToCacheStub.called).to.be.true;
    });
  });

  describe("cancelSaveComment", () => {
    it("should retain its original body text.", async () => {
        const newBody = new vscode.MarkdownString("Hello, world!");
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtManager.addComment(reply);

        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtManager.cancelSaveComment(comment);
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.contextValue).to.be.equal("comment");
    });
  });

  describe("deleteThread", () => {
    it("should delete the comment thread from a controller and its comments from cache.", async () => {
        const addToCacheStub = sinon.stub(addonCache, "addToCache");

        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtManager.addComment(reply);

        const disposeStub = sinon.stub(comment.thread, "dispose");
        await cmtManager.deleteThread(comment.thread);
        expect(disposeStub.calledOnce).to.be.true;

        // was removed from cache
        expect(addToCacheStub.called).to.be.true;
    });
  });

  describe("editComment", () => {
    it("should set a comment to edit mode.", async () => {
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtManager.addComment(reply);

        expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
        expect(comment.body.value).to.be.equal(cmt.body);
        cmtManager.editComment(thread);
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);
    });
  
    it("should clear the body if a markForReview comment.", async () => {
        const cmtManager = new CommentManager("assay-tester", "Assay Tester");
        const thread = cmtManager.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, "");
        const comment = await cmtManager.addComment(reply);

        expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
        expect(comment.body.value).to.be.equal("Marked for review.");
        cmtManager.editComment(thread);
        expect(comment.body.value).to.be.equal("");
        expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);      
    });
  });

  describe("deleteComments", () => {
    it("should delete all comments in the URI's GUID and version and create, replace, and activate a new controller with re-fetched comments in place of the old one.", async () => {
      sinon.stub(Object, 'entries').returns([
        ["filepath", "comments"]
      ]);
      const addToCacheStub = sinon.stub(addonCache, "addToCache");
      const loadFileDecoratorStub = sinon.stub(loadFileDecorator, "loadFileDecorator");

      const cmtManager = new CommentManager("assay-tester", "Assay Tester");
      const initController = cmtManager.controller;
      await cmtManager.deleteComments(vscode.Uri.file("/test-root/guid/version"));
      const newController = cmtManager.controller;
      expect(addToCacheStub.called).to.be.true;
      expect(loadFileDecoratorStub.called).to.be.true;
      expect(initController).to.not.equal(newController);
    });

  });

});


