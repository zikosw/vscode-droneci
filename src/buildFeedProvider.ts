import * as vscode from 'vscode';
import axios from 'axios';
import { emojify } from 'node-emoji';
import { resolve } from 'dns';
import { EMFILE } from 'constants';

class ViewNode extends vscode.TreeItem {
    constructor(readonly label: string, readonly collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
    }

    get uri(): string {
        return "";
    }
    get link(): string {
        return "";
    }
}

export class BuildFeedProvider implements vscode.TreeDataProvider<ViewNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<ViewNode | undefined> = new vscode.EventEmitter<ViewNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ViewNode | undefined> = this._onDidChangeTreeData.event;
    private droneServer?: string;
    private droneToken?: string;

    constructor() {
        this.GetConfig();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private GetConfig() {
        this.droneServer = vscode.workspace.getConfiguration('droneci').get<string>('server');
        this.droneToken = vscode.workspace.getConfiguration('droneci').get<string>('token');
    }

    getTreeItem(element: ViewNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ViewNode): Thenable<ViewNode[]> {
        if (element) {
            return this.GetSteps(element as Feed);
        }
        return this.GetFeed();
    }

    private GetSteps(feed: Feed): Promise<ViewNode[]> {
        this.GetConfig();
        return new Promise((resolve, reject) => {
            let url = `${this.droneServer}${feed.uri}`;
            axios.get<Build>(url, { headers: { Authorization: `Bearer ${this.droneToken}` } })
                .then(resp => resp.data)
                .then(build => {
                    if (build.status === 'pending') {
                        return resolve([]);
                    }
                    let newData = build.stages.map(stg => {
                        return stg.steps.map(stp => new Step(feed.slug, build.number, stg.number, stp.number, stp.name, stp.status));
                    });
                    let dt: Step[] = [];
                    dt = dt.concat(...newData);
                    return resolve(dt);
                })
                .catch(err => reject(err));

        });
    }

    private GetFeed(): Promise<ViewNode[]> {
        this.GetConfig();
        return new Promise((resolve, reject) => {
            axios.get<Feed[]>(`${this.droneServer}/api/user/builds`, { headers: { Authorization: `Bearer ${this.droneToken}` } })
                .then(function (response) {
                    return response.data;
                })
                .then(data => {
                    let newData: Feed[] = data.map(f => {
                        return new Feed(f.build, f.name, f.slug, f.uid, f.version, vscode.TreeItemCollapsibleState.Collapsed);
                    });
                    return resolve(newData);
                })
                .catch(function (error) {
                    // handle error
                    reject(error);
                });
        });
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
        case 'killed':
            return '🔪';
        case 'skipped':
            return '🚫';
        default:
            return '❔';
    }
}

export class Feed extends ViewNode {

    constructor(
        // public readonly active: Boolean,
        public readonly build: Build,
        public readonly name: string,
        public readonly slug: string,
        public readonly uid: string,
        public readonly version: Number,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(`${EmojiStatus(build.status)}${build.number} ${emojify(build.message)}`, collapsibleState);
    }


    get tooltip(): string {
        return `${this.slug}-${this.build.source}`;
    }

    get description(): string {
        return `${this.build.status}`;
    }

    get iconPath(): any {
        return vscode.Uri.parse(this.build.author_avatar);
    }
    get uri(): string {
        return `/api/repos/${this.slug}/builds/${this.build.number}`;
    }

    contextValue = 'feed';

}

class Build extends ViewNode {
    constructor(
        public readonly author_avatar: string,
        public readonly author_name: string,
        public readonly created: Number,
        public readonly number: Number,
        public readonly link: string,
        public readonly message: string,
        public readonly status: string,
        public readonly source: string,
        public readonly stages: Stage[],
    ) {
        super(`${author_name}`, vscode.TreeItemCollapsibleState.Collapsed);
    }
    contextValue = 'build';
}

class Stage extends ViewNode {
    constructor(
        public readonly name: string,
        public readonly number: Number,
        public readonly steps: Step[],
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed);
    }
    contextValue = 'stage';

}

export class Step extends ViewNode {
    constructor(
        public readonly slug: string,
        public readonly build_number: Number,
        public readonly stage_number: Number,
        public readonly number: Number,
        public readonly name: string,
        public readonly status: string,
    ) {
        super(`${EmojiStatus(status)} ${name}`, vscode.TreeItemCollapsibleState.None);
    }

    get link(): string {
        return `${this.slug}/${this.build_number}/${this.stage_number}/${this.number}`;
    }
    contextValue = 'step';

}
