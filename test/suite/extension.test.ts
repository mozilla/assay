import { expect } from "chai";
import * as fs from "fs";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { DirectoryController } from "../../src/controller/directoryController";
import { UrlController } from "../../src/controller/urlController";
import { activate, deactivate } from "../../src/extension";

function makeContext() {
  return {
    subscriptions: [] as vscode.Disposable[],
    globalStorageUri: vscode.Uri.parse("test"),
    globalState: {
      get: () => undefined,
      update: () => undefined,
    },
  } as unknown as vscode.ExtensionContext;
}

describe("extension.ts", () => {
  beforeEach(() => {
    const workspaceFoldersStub = sinon.stub(
      vscode.workspace,
      "workspaceFolders"
    );
    workspaceFoldersStub.value([
      {
        uri: vscode.Uri.parse("test-root-uri"),
      },
    ]);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should deactivate and return undefined", async () => {
    const result = deactivate();
    expect(result).to.be.undefined;
  });

  it("should load the manifest if launched with the intention to do so.", async () => {
    const directoryControllerStub = sinon.stub(
      DirectoryController.prototype,
      "getRootFolderPath"
    );
    directoryControllerStub.resolves("test");
    const existsSyncStub = sinon.stub(fs, "existsSync");
    existsSyncStub.returns(true);

    sinon
      .stub(vscode.window, "createTreeView")
      .returns({ dispose: () => undefined } as any);

    const context = makeContext();
    sinon.stub(context.globalState, "get").withArgs("filePath").returns("test");

    context.globalState.update = sinon.stub();
    const openCachedFileStub = sinon.stub(
      UrlController.prototype,
      "openCachedFile"
    );

    sinon.stub(vscode.window, "registerUriHandler");
    sinon.stub(vscode.commands, "registerCommand");
    await activate(context);
    expect(openCachedFileStub.calledOnce).to.be.true;
    expect(context.subscriptions.length).to.be.greaterThan(10);
  });
});
