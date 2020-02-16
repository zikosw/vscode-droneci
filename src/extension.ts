// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BuildFeedProvider } from './buildFeedProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const buildFeedProvider = new BuildFeedProvider();
	vscode.window.registerTreeDataProvider('droneBuildFeed', buildFeedProvider);
	vscode.commands.registerCommand('droneBuildFeed.refreshEntry', () => buildFeedProvider.refresh());

	console.log('Congratulations, your extension "droneci" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
