import { expect } from "chai";
import { describe, it } from "mocha";

import {
  AssayTreeDataProvider,
  AssayTreeItem,
} from "../../../src/views/sidebarView";

const sidebarView = new AssayTreeDataProvider();

describe("sidebarView.ts", () => {
  it("should get the children", async () => {
    const children = await sidebarView.getChildren();
    const tab = children[0];
    expect(children).to.be.an("array");
    expect(children).to.have.lengthOf(1);
    expect(tab.label).to.equal("Commands");

    const tabChildren = await sidebarView.getChildren(tab);
    expect(tabChildren).to.be.an("array");
    expect(tabChildren).to.have.lengthOf(7);
    expect(tabChildren[0].label).to.equal("Review New Addon Version");
    expect(tabChildren[3].label).to.equal("Test API Credentials");
  });

  it("should get the tree item", async () => {
    const children = await sidebarView.getChildren();
    const tab = children[0];
    const tabChildren = await sidebarView.getChildren(tab);
    const treeItem = sidebarView.getTreeItem(tabChildren[0]);
    expect(treeItem.label).to.equal("Review New Addon Version");
  });

  it("should return nothing with an invalid element", async () => {
    const treeItem: AssayTreeItem = new AssayTreeItem("test");
    const children = await sidebarView.getChildren(treeItem);
    expect(children).to.be.an("array");
    expect(children).to.have.lengthOf(0);
  });
});