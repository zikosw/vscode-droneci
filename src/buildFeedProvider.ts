import * as vscode from 'vscode';
import axios from 'axios';
import { ViewNode } from './viewnode';
import { APIConfig, getConfig, Build, Feed, Step } from './droneci';


export class BuildFeedProvider implements vscode.TreeDataProvider<ViewNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<ViewNode | undefined> = new vscode.EventEmitter<ViewNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ViewNode | undefined> = this._onDidChangeTreeData.event;
    private droneCfg: APIConfig;

    constructor() {
        this.droneCfg = getConfig();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
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
        return new Promise((resolve, reject) => {
            let url = `${this.droneCfg.server}${feed.uri}`;
            axios.get<Build>(url, this.droneCfg.headers)
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
        return new Promise((resolve, reject) => {
            axios.get<Feed[]>(`${this.droneCfg.server}/api/user/builds`, this.droneCfg.headers)
                .then(resp => resp.data)
                .then(data => {
                    let newData: Feed[] = data.map(f => {
                        return new Feed(f.build, f.name, f.slug, f.uid, f.version, vscode.TreeItemCollapsibleState.Collapsed);
                    });

                    if (newData.length === 0) {
                        vscode.window.showInformationMessage("Build feed is empty");
                    }

                    return resolve(newData);
                })
                .catch(error => {
                    // handle error
                    vscode.window.showErrorMessage("Unable to fetch build feed: " + error);
                    reject(error);
                });
        });
    }

}