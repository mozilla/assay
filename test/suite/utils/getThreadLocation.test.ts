import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { AssayThread, contextValues } from "../../../src/config/comment";
import getThreadLocation, { rangeToString, rangeTruncation, stringToRange } from "../../../src/utils/getThreadLocation";
import * as reviewRootDir from "../../../src/utils/reviewRootDir";


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
    it("should return the thread's Uri guid, version, filepath and range", async () => {
        const controller = vscode.comments.createCommentController("assay-tester", "Assay Tester");
        const thread = controller.createCommentThread(cmt.uri, rng, []) as AssayThread;
        const {guid, version, filepath, range} = await getThreadLocation(thread);

        expect(guid).to.be.equal('test-guid');
        expect(version).to.be.equal('test-version');
        expect(filepath).to.be.equal('/test-filepath');
        expect(range).to.be.equal('#L1');

    });

    it("should throw an error & show an error message if file not in root folder", async () => {
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
    it("should convert a single-line range correctly", async () => {
        const range = rangeToString(rng);
        expect(range).to.equal("#L1");
    });

    it("should convert a multi-line range correctly", async () => {
        const range = rangeToString(multiRng);
        expect(range).to.equal("#L1-5");
    });
  });

  describe("stringToRange()", () => {
    it("should reject an incorrectly-formatted string", async () => {
        const str = '#L1-';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L1-");
        }
        
    });

    it("should reject an incorrectly-formatted string", async () => {
        const str = '#L-23';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-23");
        }
        
    });

    it("should reject an incorrectly-formatted string", async () => {
        const str = '#l1-2';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #l1-2");
        }
        
    });

    it("should reject a string with no numbers", async () => {
        const str = '#L-';
        try{
            const result = await stringToRange(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-");
        }
    });
    
    it("should correctly return a single-line range", async () => {
        const str = '#L1';
        const result = await stringToRange(str);
        expect(result).to.deep.equal(rng);
    });
    it("should correctly return a multi-line range", async () => {
        const str = '#L1-5';
        const result = await stringToRange(str);
        expect(result).to.deep.equal(multiRng);
    });
  });

  describe("rangeTruncation()", () => {
    
    it("should reject an incorrectly-formatted string", async () => {
        const str = '#L1-';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L1-");
        }
        
    });

    it("should reject an incorrectly-formatted string", async () => {
        const str = '#L-23';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-23");
        }
        
    });

    it("should reject an incorrectly-formatted string", async () => {
        const str = '#l1-2';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #l1-2");
        }
        
    });

    it("should reject a string with no numbers", async () => {
        const str = '#L-';
        try{
            const result = rangeTruncation(str);
            expect(result).to.be.empty;
        }catch(e: any){
            expect(e.message).to.equal("Passed string is not a line number: #L-");
        }
    });

    it("should correctly adjust a single-line range", async () => {
        const str = '#L1';
        const result = rangeTruncation(str);
        expect(result).to.equal("#L2");
    });
    it("should correctly adjust a multi-line range", async () => {
        const str = '#L1-5';
        const result = rangeTruncation(str);
        expect(result).to.equal("#L2-6");
    });
  });

});

