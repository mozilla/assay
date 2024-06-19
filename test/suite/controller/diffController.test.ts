import { expect } from "chai";
import * as child_process from "child_process";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { DiffController } from "../../../src/controller/diffController";


describe("diffController.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("openInDiffTool()", () => {
    it("should return false if no diff command is provided.", async () => {
        const config = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };
        const diffController = new DiffController(config);
        const getDiffCommandStub = sinon.stub(diffController, <any>"getDiffCommand");
        getDiffCommandStub.resolves(undefined);

        const result = await diffController.openInDiffTool([
            vscode.Uri.parse("file:///path/to/file1"),
            vscode.Uri.parse("file:///path/to/file2"),
        ]);
        expect(result).to.be.false;
    });

    it("should return true if child process runs.", async () => {
        const config = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };
        const diffController = new DiffController(config);
        const getDiffCommandStub = sinon.stub(diffController, <any>"getDiffCommand");
        getDiffCommandStub.resolves("diff");

        const spawnStub = sinon.stub(child_process, "spawn");
        const fakeChildProcess = {
        on: sinon.stub(),
        } as unknown as child_process.ChildProcess;
        spawnStub.returns(fakeChildProcess);

        const result = await diffController.openInDiffTool([
        vscode.Uri.parse("file:///path/to/file1"),
        vscode.Uri.parse("file:///path/to/file2"),
        ]);
        expect(result).to.be.true;
    });
  });

  describe("setDiffCommand()", () => {
    it("should throw an error if no input is provided.", async () => {
        const config = {
            update: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            let: sinon.stub(),
            inspect: sinon.stub(),
        };
        const diffController = new DiffController(config);
        
        const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
        inputBoxStub.resolves(undefined);
        try{
            await diffController["setDiffCommand"]();
        }
        catch(e: any){
            expect(e.message).to.equal("No diff command provided.");
        }
    });

    it("should return the input and update the config if input is provided.", async () => {
      const config = {
        update: sinon.stub(),
        get: sinon.stub(),
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
      };
      const diffController = new DiffController(config);

      const inputBoxStub = sinon.stub(vscode.window, "showInputBox");
      inputBoxStub.resolves("diff -rq");

      const result = await diffController["setDiffCommand"]();


      expect(result).to.equal("diff -rq");
      expect(config.update.calledOnce).to.be.true;
    });
  });

  describe("getDiffCommand()", () => {
    it("should return the diff command from the config if it exists.", async () => {
      const config = {
        update: sinon.stub(),
        get: sinon.stub(),
        has: sinon.stub(),
        let: sinon.stub(),
        inspect: sinon.stub(),
      };
      config.get.returns("diff -rq");
      const diffController = new DiffController(config);

      const result = await diffController["getDiffCommand"]();
      expect(result).to.equal("diff -rq");
      expect(config.get.calledOnce).to.be.true;
    });
  });

});