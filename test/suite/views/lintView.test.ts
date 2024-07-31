import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";

import { LintView } from "../../../src/views/lintView";


describe("lintView.ts", () => {
      afterEach(async () => {
        sinon.restore();
      });

      describe("getDeleteCommentsPreference", () => {
        it("should give the user a prompt.", async () => {
            const showInformationMessageStub = sinon.stub(
                vscode.window,
                "showInformationMessage"
              );
            LintView.warnOnSave();
            expect(showInformationMessageStub.called).to.be.true;
        });
    });
});