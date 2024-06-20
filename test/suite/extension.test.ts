import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

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
      const workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders");
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
    const context = makeContext();
    sinon.stub(context.globalState, 'get').withArgs("filePath").returns("test");

    context.globalState.update = sinon.stub();
    const openCachedFileStub = sinon.stub(UrlController.prototype, "openCachedFile");    

    sinon.stub(vscode.window, "registerUriHandler");
    sinon.stub(vscode.commands, "registerCommand");
    await activate(context);
    expect(openCachedFileStub.calledOnce).to.be.true;
    const commands = await vscode.commands.getCommands(true);
    expect(commands).to.include.members(["assay.get"]);
    expect(commands).to.include.members(["assay.welcome"]);
    expect(commands).to.include.members(["assay.review"]);
    expect(context.subscriptions.length).to.be.greaterThan(10);    
  });
});
