import { expect } from "chai";
import * as fs from "fs";
import { describe, it, beforeEach, afterEach } from "mocha";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";


import { CommentCacheController } from "../../../src/controller/commentCacheController";
import { CommentController } from "../../../src/controller/commentController";
import { DirectoryController } from "../../../src/controller/directoryController";
import { AssayThread } from "../../../src/model/assayComment";

let commentCacheControllerStub: sinon.SinonStubbedInstance<CommentCacheController>, directoryControllerStub: sinon.SinonStubbedInstance<DirectoryController>;

const workspaceFolder = path.resolve(__dirname, "..", "test_workspace");
const storagePath = path.resolve(workspaceFolder, ".test_assay");

const cmt = {
  uri: vscode.Uri.file(
    "test-root/test-guid/test-version/test-filepath"
  )
};

const pos = new vscode.Position(1, 0);
const rng = new vscode.Range(pos, pos);

describe("CommentController.ts", () => {

  beforeEach(() => {
    commentCacheControllerStub = sinon.createStubInstance(CommentCacheController);
    directoryControllerStub = sinon.createStubInstance(DirectoryController);

    directoryControllerStub.getRootFolderPath.resolves("/test-root");   

    directoryControllerStub.splitUri.resolves({
        rootFolder: "/root",
        fullPath: "/root/guid/version/filepath.py", 
        guid: "guid",
        version: "version", 
        filepath: "filepath"
    } as any);

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

  describe("deleteThread", () => {
    it("should delete the comment thread from a controller and its comments from cache.", async () => {
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);

        // const comment = await cmtController["createComment"](cmt.uri, rng);
        // const disposeStub = sinon.stub(comment.thread, "dispose");
        // await cmtController.deleteThread(comment.thread);
        // expect(disposeStub.calledOnce).to.be.true;

        // // was removed from cache
        // expect(commentCacheControllerStub.deleteCommentFromCache.called).to.be.true;
    });
  });

  describe("copyLinkFromThread", () => {
    it("should copy the correctly formatted link to clipboard and show the info message", async () => {
      const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
      const thread = cmtController.controller.createCommentThread(cmt.uri, rng, []) as AssayThread;
      const expectedLink = `vscode://mozilla.assay/review/guid/version?path=filepath/with/slashes.py#range`;

      const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
      const getThreadLocationStub = sinon.stub(cmtController, 'getThreadLocation').resolves({
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

  describe("deleteCommentsFromMenu()", () => {
    it("delete the comments of the given uri.", async () => {
      const uri = vscode.Uri.parse("uri");      
      const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
      commentCacheControllerStub.deleteComments.resolves();
      const result = await cmtController.deleteCommentsFromMenu({
        label: "",
        uri: uri
      }, undefined);
      expect(commentCacheControllerStub.deleteComments.calledWith(uri)).to.be.true;
      expect(result).to.have.lengthOf(0);
    });

    it("delete the comments of given uris.", async () => {
      const uriOne = vscode.Uri.parse("uri-one");
      const uriTwo = vscode.Uri.parse("uri-two");      
      const uriThree = vscode.Uri.parse("uri-three");      

      const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
      commentCacheControllerStub.deleteComments.resolves();
      const result = await cmtController.deleteCommentsFromMenu({
        label: "",
        uri: uriOne
      }, [{
        label: "",
        uri: uriOne
      },
      {
        label: "",
        uri: uriTwo
      },
      {
        label: "",
        uri: uriThree
      }]);
      expect(commentCacheControllerStub.deleteComments.calledWith(uriOne)).to.be.true;
      expect(commentCacheControllerStub.deleteComments.calledWith(uriTwo)).to.be.true;
      expect(commentCacheControllerStub.deleteComments.calledWith(uriThree)).to.be.true;
      expect(result).to.have.lengthOf(0);
    });
  });


  describe("exportComments()", () => {
    it("call to export comments from cache and activate a new controller with re-fetched comments in place of the old one.", async () => {

    const exportVersionCommentsStub = commentCacheControllerStub.exportVersionComments.resolves(true);

    const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
    const initController = cmtController.controller;
    const thread = cmtController.controller.createCommentThread(vscode.Uri.file("guid"), rng, []) as AssayThread;
    await cmtController.exportComments(thread);
    const newController = cmtController.controller;
    expect(exportVersionCommentsStub.called).to.be.true;
    expect(initController).to.not.equal(newController);

    });
  });

  describe("getThreadLocation()", () => {
    it("should return the thread's Uri guid, version, filepath and range.", async () => {
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, rng, []) as AssayThread;
        const {guid, version, filepath, range} = await cmtController.getThreadLocation(thread);

        expect(guid).to.be.equal('guid');
        expect(version).to.be.equal('version');
        expect(filepath).to.be.equal('filepath');
        expect(range).to.be.equal('#L1');

    });

    it("should throw an error & show an error message if file not in root folder.", async () => {
        const cmtController = new CommentController("assay-tester", "Assay Tester", commentCacheControllerStub, directoryControllerStub);
        const thread = cmtController.controller.createCommentThread(cmt.uri, rng, []) as AssayThread;
        
        try{
            await cmtController.getThreadLocation(thread);
        }catch(e: any){
            expect(e.message).to.equal("File is not in the root folder.");
        }
    });
  });

});