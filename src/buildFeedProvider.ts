import * as vscode from 'vscode';
import axios from 'axios';
import { emojify } from 'node-emoji';

export class BuildFeedProvider implements vscode.TreeDataProvider<Feed> {

    private _onDidChangeTreeData: vscode.EventEmitter<Feed | undefined> = new vscode.EventEmitter<Feed | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Feed | undefined> = this._onDidChangeTreeData.event;

    constructor() {

    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Feed): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Feed): Thenable<Feed[]> {
        return this.GetFeed();
    }

    private GetFeed(): Promise<Feed[]> {
        // TODO: define const for `droneci` and cfg-key
        const droneServer = vscode.workspace.getConfiguration('droneci').get<string>('server');
        const droneToken = vscode.workspace.getConfiguration('droneci').get<string>('token');

        return new Promise((resolve, reject) => {
            axios.get<Feed[]>(`${droneServer}/api/user/builds`, { headers: { Authorization: `Bearer ${droneToken}` } })
                .then(function (response) {
                    return response.data;
                })
                .then(data => {
                    let newData: Feed[] = data.map(f => {
                        return new Feed(f.build, f.name, f.slug, f.uid, f.version);
                    });
                    return resolve(newData);
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                    reject(error);
                });
        });
    }

}

class Build {
    constructor(
        public readonly author_avatar: string,
        public readonly author_name: string,
        public readonly created: Number,
        public readonly number: Number,
        public readonly link: string,
        public readonly message: string,
        public readonly status: string,
        public readonly source: string,
    ) {

    }
}


function EmojiStatus(status: string): string {
    switch (status) {
        case 'success':
            return '✅';
        case 'failure':
            return '❌';
        case 'running':
            return '🕐';
        default:
            return '❔';
    }
}

export class Feed extends vscode.TreeItem {

    constructor(
        // public readonly active: Boolean,
        public readonly build: Build,
        public readonly name: string,
        public readonly slug: string,
        public readonly uid: string,
        public readonly version: Number,
        // public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(`${EmojiStatus(build.status)}${build.number} ${emojify(build.message)}`);
    }



    get tooltip(): string {
        return `${this.slug}-${this.build.source}`;
    }

    get description(): string {
        return `${this.slug}`;
    }

    get iconPath(): any {
        return vscode.Uri.parse(this.build.author_avatar);
    }

    contextValue = 'feed';

}