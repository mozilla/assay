import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { activate, deactivate } from "../../src/extension";
import * as reviewRootDir from "../../src/utils/reviewRootDir";

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
    const rootUri = vscode.Uri.parse("test-root-uri");
      const getRootFolderPathStub = sinon.stub(
        reviewRootDir,
        "getRootFolderPath"
      );
      getRootFolderPathStub.resolves(rootUri.fsPath);

      const workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders");
      workspaceFoldersStub.value([
        {
          uri: rootUri,
        },
      ]);
  });
  
  afterEach(() => {
    sinon.restore();
  });

  it("should deactivate and return undefined", async () => {
    // placeholder due to blank deactivate function
    const result = deactivate();
    expect(result).to.be.undefined;
  });

  it("should load the manifest if launched with the intention to do so.", async () => {
    const context = makeContext();
    sinon.stub(context.globalState, 'get').withArgs("filePath").returns("test");

    context.globalState.update = sinon.stub();
    const showTextDocumentStub = sinon.stub(vscode.window, "showTextDocument");
    showTextDocumentStub.resolves();

    sinon.stub(vscode.window, "registerUriHandler");
    sinon.stub(vscode.commands, "registerCommand");
    await activate(context);
    expect(showTextDocumentStub.calledOnce).to.be.true;
    const commands = await vscode.commands.getCommands(true);
    expect(commands).to.include.members(["assay.get"]);
    expect(commands).to.include.members(["assay.welcome"]);
    expect(commands).to.include.members(["assay.review"]);
    expect(context.subscriptions.length).to.be.greaterThan(10);    
  });
});
