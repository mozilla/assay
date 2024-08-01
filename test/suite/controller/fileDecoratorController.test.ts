import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { FileDecoratorController } from "../../../src/controller/fileDecoratorController";
import { CustomFileDecorationProvider } from "../../../src/model/fileDecorationProvider";

let customFileDecorationProviderStub: sinon.SinonStubbedInstance<CustomFileDecorationProvider>;
let fileDecoratorController: FileDecoratorController;

describe("fileDecoratorController.ts", async () => {
  beforeEach(() => {
    customFileDecorationProviderStub = sinon.createStubInstance(
      CustomFileDecorationProvider
    );
    fileDecoratorController = new FileDecoratorController(
      customFileDecorationProviderStub
    );
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("loadFileDecoratorByUri()", async () => {
    it("should call the fileDecorationProvider.", async () => {
      const uri = vscode.Uri.parse("test-uri");
      await fileDecoratorController.loadFileDecoratorByUri(uri);
      expect(
        customFileDecorationProviderStub.updateDecorations.calledOnceWith(uri)
      ).to.be.true;
    });
  });
});
