import { expect } from "chai";
import * as fs from "fs";
import { afterEach, describe, it } from "mocha";
import * as fetch from "node-fetch";
import path = require("path");
import * as sinon from "sinon";
import * as vscode from "vscode";

import {
  statusBarItem,
  updateTaskbar,
} from "../../../amo/commands/updateTaskbar";

describe("updateTaskbar.ts", async () => {
  afterEach(() => {
    sinon.restore();
  });

  const fakeActiveEditor = {
    document: {
      uri: {
        fsPath: "test",
      },
    },
  };

  const fakeActiveEditor2 = {
    document: {
      uri: {
        fsPath: "root/12345678-1234-1234-1234-123456789abc/version/test.js",
      },
    },
  };

  const fakeWorkspaceFolder = {
    uri: {
      fsPath: "root",
    },
  };

  it("should return undefined if there is no activeTextEditor", async () => {
    // by default, vscode.window.activeTextEditor is undefined
    expect(await updateTaskbar()).to.be.undefined;
  });

  it("should return undefined if there is no root workspaceFolder", async () => {
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.returns(fakeActiveEditor);
    sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

    const stub2: sinon.SinonStub<any[], any> = sinon.stub();
    stub2.returns(undefined);
    sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

    expect(await updateTaskbar()).to.be.undefined;
  });

  it("should return undefined if there is no guid or version", async () => {
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.returns(fakeActiveEditor);
    sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

    const stub2: sinon.SinonStub<any[], any> = sinon.stub();
    stub2.returns([fakeWorkspaceFolder]);
    sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

    expect(await updateTaskbar()).to.be.undefined;
  });

  it("should return undefined if the response status is 404", async () => {
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.returns(fakeActiveEditor2);
    sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

    const stub2: sinon.SinonStub<any[], any> = sinon.stub();
    stub2.returns([fakeWorkspaceFolder]);
    sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

    const stub3: sinon.SinonStub<any[], any> = sinon.stub();
    stub3.returns({
      status: 404,
    });
    sinon.replace(fetch, "default", stub3 as any);

    expect(await updateTaskbar()).to.be.undefined;
  });

  it("should update the statusBarItem with default guid structure", async () => {
    const stub: sinon.SinonStub<any[], any> = sinon.stub();
    stub.returns(fakeActiveEditor2);
    sinon.replaceGetter(vscode.window, "activeTextEditor", stub as any);

    const stub2: sinon.SinonStub<any[], any> = sinon.stub();
    stub2.returns([fakeWorkspaceFolder]);
    sinon.replaceGetter(vscode.workspace, "workspaceFolders", stub2 as any);

    const stub3: sinon.SinonStub<any[], any> = sinon.stub();
    stub3.returns({
      status: 200,
    });
    sinon.replace(fetch, "default", stub3 as any);

    expect(await updateTaskbar()).to.be.undefined;
    expect(statusBarItem.text).to.equal(
      "{12345678-1234-1234-1234-123456789abc} version"
    );
    expect(statusBarItem.tooltip).to.equal(
      "https://reviewers.addons-dev.allizom.org/en-US/reviewers/review/{12345678-1234-1234-1234-123456789abc}"
    );
  });
});
