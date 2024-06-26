import { expect } from "chai";
import { describe, it, afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";

import { SidebarController } from "../../../src/controller/sidebarController";
import { AddonTreeDataProvider } from "../../../src/model/sidebarTreeDataProvider";

let sidebarController: SidebarController;

describe("fileDecoratorController.ts", async () => {
  beforeEach(() => {
    sidebarController = new SidebarController("test", "testRootFolderPath");
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe("SidebarController.ts", async () => {
    it("should construct the treeView and refresh function.", async () => {
        expect(sidebarController.treeView).to.not.be.undefined;
        const refreshStub = sinon.stub(AddonTreeDataProvider.prototype, "refresh");
        sidebarController.refresh();
        expect(refreshStub.called).to.be.true;
    });
  });
});
