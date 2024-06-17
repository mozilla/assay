import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";


import { CommentCacheController } from "../../../src/controller/commentCacheController";
import { CommentController } from "../../../src/controller/commentController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { RangeController } from "../../../src/controller/rangeController";
import { AssayReply, AssayThread } from "../../../src/model/comment";
import { contextValues } from "../../../src/types";


let commentCacheControllerStub: CommentCacheController, directoryControllerStub: DirectoryController, rangeControllerStub: RangeController;

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");

const cmt = {
  uri: vscode.Uri.file(
    "test-root/test-guid/test-version/test-filepath"
  ),
  body: "test-comment",
  contextValue: "comment" as contextValues
};

const pos = new vscode.Position(1, 0);
const range = new vscode.Range(pos, pos);

describe("CommentController.ts", () => {

  beforeEach(() => {

    commentCacheControllerStub = sinon.createStubInstance(CommentCacheController);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);
    rangeControllerStub = sinon.createStubInstance(RangeController);

    sinon.stub(DirectoryController.prototype, "getRootFolderPath").resolves("/test-root");
    sinon.stub(CommentCacheController.prototype, "saveCommentToCache");

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
        const saveCommentToCacheStub = sinon.stub(CommentCacheController.prototype, "saveCommentToCache");

        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);

        // was created, and correctly
        expect(thread.comments.length).to.be.equal(0);
        await cmtController.addComment(reply);
        expect(thread.comments.length).to.be.equal(1);

        const comment = thread.comments[0];
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.contextValue).to.be.equal(cmt.contextValue);
        expect(comment.thread).to.be.equal(thread);
        expect(comment.thread.comments.length).to.be.equal(1);
        expect(comment.thread.comments[0]).to.be.equal(comment);

        // was added to cache
        expect(saveCommentToCacheStub.called).to.be.true;
    });

    it("should create a markForReview & comment thread from an empty reply.", async () => {
        const saveCommentToCacheStub = sinon.stub(CommentCacheController.prototype, "saveCommentToCache");
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, "");

        // was created
        expect(thread.comments.length).to.be.equal(0);
        await cmtController.addComment(reply);
        expect(thread.comments.length).to.be.equal(1);  
        expect(thread.comments[0].body.value).to.be.equal("Marked for review.");
        expect(thread.comments[0].contextValue).to.be.equal("markForReview");

        // was added to cache
        expect(saveCommentToCacheStub.called).to.be.true;
    });
  });

  describe("saveComment", () => {
    it("should update a comment's body to the new string both in comment and in cache.", async () => {
        const saveCommentToCacheStub = sinon.stub(CommentCacheController.prototype, "saveCommentToCache");

        const newBody = new vscode.MarkdownString("Hello, world!");
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtController.addComment(reply);

        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtController.saveComment(comment);
        expect(comment.body.value).to.be.equal(newBody.value);
        expect(comment.contextValue).to.be.equal("comment");
        
        // was added to cache
        expect(saveCommentToCacheStub.called).to.be.true;
    });
    it("should take an empty string and populate it as marked.", async () => {
        const saveCommentToCacheStub = sinon.stub(CommentCacheController.prototype, "saveCommentToCache");

        const newBody = new vscode.MarkdownString("");
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtController.addComment(reply);


        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtController.saveComment(comment);
        expect(comment.body.value).to.be.equal("Marked for review.");
        expect(comment.contextValue).to.be.equal("markForReview");
        
        // was added to cache
        expect(saveCommentToCacheStub.called).to.be.true;
    });
  });

  describe("cancelSaveComment", () => {
    it("should retain its original body text.", async () => {
        const newBody = new vscode.MarkdownString("Hello, world!");
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtController.addComment(reply);

        expect(comment.body.value).to.be.equal(cmt.body);
        comment.body = newBody;
        await cmtController.cancelSaveComment(comment);
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.contextValue).to.be.equal("comment");
    });
  });

  describe("deleteThread", () => {
    it("should delete the comment thread from a controller and its comments from cache.", async () => {
        const saveCommentToCacheStub = sinon.stub(CommentCacheController.prototype, "saveCommentToCache");

        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtController.addComment(reply);

        const disposeStub = sinon.stub(comment.thread, "dispose");
        await cmtController.deleteThread(comment.thread);
        expect(disposeStub.calledOnce).to.be.true;

        // was removed from cache
        expect(saveCommentToCacheStub.called).to.be.true;
    });
  });

  describe("editComment", () => {
    it("should set a comment to edit mode.", async () => {
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, cmt.body);
        const comment = await cmtController.addComment(reply);

        expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
        expect(comment.body.value).to.be.equal(cmt.body);
        cmtController.editComment(thread);
        expect(comment.body.value).to.be.equal(cmt.body);
        expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);
    });
  
    it("should clear the body if a markForReview comment.", async () => {
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
        const reply = new AssayReply(thread, "");
        const comment = await cmtController.addComment(reply);

        expect(comment.mode).to.be.equal(vscode.CommentMode.Preview);
        expect(comment.body.value).to.be.equal("Marked for review.");
        cmtController.editComment(thread);
        expect(comment.body.value).to.be.equal("");
        expect(comment.mode).to.be.equal(vscode.CommentMode.Editing);      
    });
  });

  describe("copyLinkFromReply", () => {
    it("should call copyLinkFromThread with the reply's thread", () => {
      const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
      const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const reply = new AssayReply(thread, cmt.body);
      const copyLinkFromThreadStub = sinon.stub(cmtController, 'copyLinkFromThread');

      cmtController.copyLinkFromReply(reply);

      expect(copyLinkFromThreadStub.calledOnceWith(thread)).to.be.true;
    });
  });

  describe("copyLinkFromThread", () => {
    it("should copy the correctly formatted link to clipboard and show the info message", async () => {
      const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
      const thread = cmtController.controller.createCommentThread(cmt.uri, range, []) as AssayThread;
      const expectedLink = `vscode://mozilla.assay/review/guid/version?path=filepath/with/slashes.py#range`;

      const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
      const getThreadLocationStub = sinon.stub(CommentController.prototype, 'getThreadLocation').resolves({
        uri: vscode.Uri.parse("/test-root/guid/version/filepath/with/slashes.py"),
        guid: 'guid',
        version: 'version',
        filepath: 'filepath/with/slashes.py',
        range: '#range'
      });

      const link = await cmtController.copyLinkFromThread(thread);
  
      expect(getThreadLocationStub.called).to.be.true;
      expect(showInformationMessageStub.calledOnce).to.be.true;
      expect(link).to.equal(expectedLink);
  
    });
});


  describe("exportComments()", () => {
    it("call to export comments from cache and activate a new controller with re-fetched comments in place of the old one.", async () => {

    const exportVersionCommentsStub = sinon.stub(CommentCacheController.prototype, "exportVersionComments").resolves(true);

    const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub, rangeControllerStub);
    const initController = cmtController.controller;
    const thread = cmtController.controller.createCommentThread(vscode.Uri.file("guid"), range, []) as AssayThread;
    await cmtController.exportComments(thread);
    const newController = cmtController.controller;
    expect(exportVersionCommentsStub.called).to.be.true;
    expect(initController).to.not.equal(newController);

    });
  });

});


import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AssayThread } from "../../../src/model/comment";
import { contextValues } from "../../../src/types";
import { getThreadLocation, rangeToString, rangeTruncation, stringToRange } from "../../../src/utils/helper";
import * as reviewRootDir from "../../../src/controller/directoryController";


const cmt = {
    uri: vscode.Uri.file(
      "test-root/test-guid/test-version/test-filepath"
    ),
    body: "test-comment",
    contextValue: "comment" as contextValues
  };
  
  const pos = new vscode.Position(1, 0);
  const pos2 = new vscode.Position(5, 0);
  const rng = new vscode.Range(pos, pos);
  const multiRng = new vscode.Range(pos2, pos);


describe("getThreadLocation.ts", () => {

  beforeEach(() => {
    sinon.stub(reviewRootDir, "getRootFolderPath").resolves("/test-root");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getThreadLocation()", () => {
    it("should return the thread's Uri guid, version, filepath and range.", async () => {
        const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
        const thread = controller.createCommentThread(cmt.uri, rng, []) as AssayThread;
        const {guid, version, filepath, range} = await getThreadLocation(thread);

        expect(guid).to.be.equal('test-guid');
        expect(version).to.be.equal('test-version');
        expect(filepath).to.be.equal('/test-filepath');
        expect(range).to.be.equal('#L1');

    });

    it("should throw an error & show an error message if file not in root folder.", async () => {
        const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
        const thread = controller.createCommentThread(vscode.Uri.file("/not-root"), rng, []) as AssayThread;
        
        try{
            await getThreadLocation(thread);
        }catch(e: any){
            expect(e.message).to.equal("File is not in the root folder.");
        }
    });
  });

  describe("rangeToString()", () => {
    it("should convert a single-line range correctly.", async () => {
        const range = rangeToString(rng);
        expect(range).to.equal("#L1");
    });

    it("should convert a multi-line range correctly.", async () => {
        const range = rangeToString(multiRng);
        expect(range).to.equal("#L1-5");
    });
  });

  describe("stringToRange()", () => {
    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#L1-';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L1-");
        }
        
    });

    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#L-23';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-23");
        }
        
    });

    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#l1-2';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #l1-2");
        }
        
    });

    it("should reject a string with no numbers.", async () => {
        const str = '#L-';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-");
        }
    });
    
    it("should correctly return a single-line range.", async () => {
        const str = '#L1';
        const result = await stringToRange(str);
        expect(result).to.deep.equal(rng);
    });
    it("should correctly return a multi-line range.", async () => {
        const str = '#L1-5';
        const result = await stringToRange(str);
        expect(result).to.deep.equal(multiRng);
    });
  });

  describe("rangeTruncation()", () => {
    
    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#L1-';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L1-");
        }
        
    });

    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#L-23';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-23");
        }
        
    });

    it("should reject an incorrectly-formatted string.", async () => {
        const str = '#l1-2';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #l1-2");
        }
        
    });

    it("should reject a string with no numbers.", async () => {
        const str = '#L-';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-");
        }
    });

    it("should correctly adjust a single-line range.", async () => {
        const str = '#L1';
        const result = rangeTruncation(str);
        expect(result).to.equal("#L2");
    });
    it("should correctly adjust a multi-line range.", async () => {
        const str = '#L1-5';
        const result = rangeTruncation(str);
        expect(result).to.equal("#L2-6");
    });
  });

});

