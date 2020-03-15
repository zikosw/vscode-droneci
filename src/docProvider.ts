import * as vscode from 'vscode';
import axios from 'axios';
import { getConfig, StepLog } from './droneci';


export  class LogProvider implements vscode.TextDocumentContentProvider {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

	provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string>{

        let cfg = getConfig();
        let url = `${cfg.server}/${uri.path}`;

        return new Promise((resolve, reject) => {
            axios.get<StepLog[]>(url, { headers: { Authorization: `Bearer ${cfg.token}` } })
                .then(resp => resp.data)
                .then(data => {
                    let logs = data.map(d => d.out).join("");
                    return resolve(logs);
                })
                .catch(err => reject(err));
        });
    }
};