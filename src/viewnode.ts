import * as vscode from 'vscode';

export class ViewNode extends vscode.TreeItem {
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