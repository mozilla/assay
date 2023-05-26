// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import nodeFetch from 'node-fetch';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let input: string | undefined;
	// Retrieve the specific addon
	let disposable = vscode.commands.registerCommand('assay.get', async function () {
	
		input = await vscode.window.showInputBox({ prompt: "Enter slug, id, or URL", title: "Assay" });
		if (!input) {
			return;
		}


		/* ******************
		*  Get Addon Info  *
		********************/
	
		let compressedFilePath: string;

		console.log('Input: ' + input);

		async function getAddonInfo(input: string) {
			if (input.includes('/')) {
				const slug = input.split('addon/')[1].split('/')[0];
				const url = `https://addons-dev.allizom.org/api/v5/addons/addon/${slug}`;

				try {
					console.log("Fetching from: " + url);
					return await nodeFetch(url);
				} catch (error) {
					console.error('An error occurred:', error);
				}

			} else if (input.includes('-')) {
				const slug = input;
				const url = `https://addons-dev.allizom.org/api/v5/addons/addon/${slug}`;

				try {
					console.log("Fetching from: " + url);
					return await nodeFetch(url);

				} catch (error) {
					console.error('An error occurred:', error);
				}

			} else {
				console.log("ID detected");
				const id = input;

				try {
					// todo
				} catch (error) {
					console.error('An error occurred:', error);
				}
			}
		}

		let response: { json: () => any; } | undefined; // set up typing for response
		response = input ? await getAddonInfo(input) : undefined;
		if (!response) {
			return;
		}

		const json = await response.json();
		console.log(json);

		const addonId = json.current_version.file.id;
		console.log('Addon ID: ' + addonId);

		const addonLocale = json.default_locale;
		const addonName = json.name[addonLocale];
		console.log('Addon Name: ' + addonName);

		const addonSlug = json.slug;
		console.log('Addon Slug: ' + addonSlug);

		const addonVersion = json.current_version.version;
		console.log('Addon Version: ' + addonVersion);

		const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
		compressedFilePath = workspaceFolder + '/' + addonSlug + '_' + addonVersion + '.xpi';




		/* ******************
		*  Get Addon File  *
		********************/

		await vscode.window.withProgress({ title: "Assay", location: vscode.ProgressLocation.Notification }, async function(progress) {
			progress.report({
			  message: "Downloading " + input
			});

			async function downloadAddon(id: string) {
				console.log('Downloading file id:' + id);
				const url = `https://addons-dev.allizom.org/firefox/downloads/file/${id}`;
				
				try {
				  const response = await nodeFetch(url);
				  
				  if (response.ok) {
					console.log("writing to " + compressedFilePath);
					const dest = fs.createWriteStream(compressedFilePath, { flags: 'w' });
					dest.write(await response.buffer());
				  } else {
					console.error('Request failed:', response.status);
				  }	
				} catch (error) {
				  console.error('An error occurred:', error);
				}
			} 

			await downloadAddon(addonId);

			console.log('Downloaded to ' + workspaceFolder);
			vscode.window.showInformationMessage('Downloaded to ' + workspaceFolder);




			/* ******************
			*  Extract Addon   *
			********************/

			vscode.window.withProgress({ title: "Assay", location: vscode.ProgressLocation.Notification }, async function(progress) {
				progress.report({
				message: "Extracting"
				});

				const extract = require('extract-zip');
				extract(compressedFilePath, { dir: workspaceFolder + '/' + addonSlug }, function (err: any) {
					if (err) {
						console.log(err);
					} else {
						console.log('Extraction complete');
						vscode.window.showInformationMessage('Extraction complete');
					}
				});
			});
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
function fetch(slugUrl: string) {
	throw new Error('Function not implemented.');
}

