// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BuildFeedProvider, Feed, Step } from './buildFeedProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const serverURL = vscode.workspace.getConfiguration('droneci').get<string>('server');

	const buildFeedProvider = new BuildFeedProvider();
	vscode.window.registerTreeDataProvider('droneBuildFeed', buildFeedProvider);
	vscode.commands.registerCommand('droneBuildFeed.refreshEntry', () => buildFeedProvider.refresh());

	vscode.commands.registerCommand('droneBuildFeed.viewBuild', (feed: Feed) => {
		vscode.env.openExternal(vscode.Uri.parse(`${serverURL}/${feed.slug}/${feed.build.number}`));
	});
	vscode.commands.registerCommand('droneBuildFeed.viewCommit', (feed: Feed) => {
		vscode.env.openExternal(vscode.Uri.parse(feed.build.link));
	});
	vscode.commands.registerCommand('droneBuildFeed.viewLog', (step: Step) => {
		vscode.env.openExternal(vscode.Uri.parse(`${serverURL}/${step.link}`));
	});


    let refreshInterval = vscode.workspace.getConfiguration('droneci').get<number>('refresh_interval');
	setInterval(() => {
		buildFeedProvider.refresh();
		console.log("interval build.refresh");
	}, (refreshInterval||5) * 60 * 1000);

	console.log('Congratulations, your extension "droneci" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
