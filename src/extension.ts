// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BuildFeedProvider } from './buildFeedProvider';
import { Feed, Step, StepLog } from './droneci';
import { LogProvider } from './docProvider';
import fetch from 'node-fetch';


function processStream(data: string): string[]| null {
	// data: eof
	if (data === 'data: eof') {
		return null;
	}
	let splitted = data.split('\n');

	let contents = splitted.filter(r=>r.length>0).map(row=> row.trim());
	console.log('contents', contents);
	return contents;
	// return JSON.parse(content);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const serverURL = vscode.workspace.getConfiguration('droneci').get<string>('server');
	const token = vscode.workspace.getConfiguration('droneci').get<string>('token');

	let url = 'https://ci.satanghq.com/api/stream/satangcorp/satang-api/1936/1/5';
	fetch(url,
		{ headers: { Authorization: `Bearer ${token}` } })
		.then((response) => {
			console.log('resp',url);
			return response.body;
		})
		.then(body => {
			body.on('data', (chunk) => {
				console.log(`Received ${chunk.length} bytes of data.`);
				console.log('data::', chunk.toString());
				console.log('processes', processStream(chunk.toString()));
			});
			body.on('end', () => {
				console.log('There will be no more data.');
			});

		})
		.catch((err) => {
			console.log("err", err);
		});


	const buildFeedProvider = new BuildFeedProvider();
	vscode.window.registerTreeDataProvider('droneBuildFeed', buildFeedProvider);
	vscode.commands.registerCommand('droneBuildFeed.refreshEntry', () => buildFeedProvider.refresh());

	vscode.commands.registerCommand('droneBuildFeed.viewBuild', (feed: Feed) => {
		vscode.env.openExternal(vscode.Uri.parse(`${serverURL}/${feed.slug}/${feed.build.number}`));
	});
	vscode.commands.registerCommand('droneBuildFeed.viewCommit', (feed: Feed) => {
		vscode.env.openExternal(vscode.Uri.parse(feed.build.link));
	});
	vscode.commands.registerCommand('droneBuildFeed.openLog', (step: Step) => {
		vscode.env.openExternal(vscode.Uri.parse(`${serverURL}/${step.link}`));
	});


    let refreshInterval = vscode.workspace.getConfiguration('droneci').get<number>('refresh_interval');
	setInterval(() => {
		buildFeedProvider.refresh();
		console.log("interval build.refresh");
	}, (refreshInterval||5) * 60 * 1000);

	///
	// register a content provider for the cowsay-scheme
	const myScheme = 'droneci.log';
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, new LogProvider));
	context.subscriptions.push(vscode.commands.registerCommand('droneBuildFeed.viewLog', async(step: Step) => {
		let uri = vscode.Uri.parse(`droneci.log:${step.logUri}`);
		let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
		console.log('doc',doc)
		await vscode.window.showTextDocument(doc, { preview: false });
	}));

	console.log('Congratulations, your extension "droneci" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
