import * as vscode from 'vscode';

import { getAddonInfo } from './AddonInfo';
import { downloadAddon } from './AddonDownload';
import { extractAddon } from './AddonExtract';

export async function activate(context: vscode.ExtensionContext) {

	let downloadAndExtract = vscode.commands.registerCommand('assay.get', async function () {

		let response: any;
	
		const input = await vscode.window.showInputBox({ prompt: "Enter slug, id, or URL", title: "Assay" });
		if (!input) {
			return;
		}
	
		// Get Metadata
		await vscode.window.withProgress({ title: "Assay", location: vscode.ProgressLocation.Notification }, async function(progress) {
			progress.report({
			  	message: "Gathering Metadata"
			});
			response = await getAddonInfo(input); // set up typing
			console.log(response);
			if (!response) {
				return;
			}
		});


		const json = await response.json();
		const addonFileId = json.current_version.file.id;
		const addonName = json.name[json.default_locale];
		const addonSlug = json.slug;
		const addonVersion = json.current_version.version;
		const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const compressedFilePath = workspaceFolder + '/' + addonSlug + '_' + addonVersion + '.xpi';


		// Download
		await vscode.window.withProgress({ title: "Assay", location: vscode.ProgressLocation.Notification }, async function(progress) {
			progress.report({
			  	message: "Downloading " + input
			});

			await downloadAddon(addonFileId, compressedFilePath);
		});
		vscode.window.showInformationMessage('Downloaded to ' + workspaceFolder);

		// Extract
		vscode.window.withProgress({ title: "Assay", location: vscode.ProgressLocation.Notification }, async function(progress) {
			progress.report({
				message: "Extracting"
			});

			await extractAddon(compressedFilePath, workspaceFolder, addonSlug);
		});
	});

	context.subscriptions.push(downloadAndExtract);
}

// This method is called when your extension is deactivated
export function deactivate() {}
function fetch(slugUrl: string) {
	throw new Error('Function not implemented.');
}

