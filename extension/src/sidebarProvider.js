const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { request } = require('./api');

const TOKEN_SECRET_KEY = 'react-arch-analyzer.token';

class ReactArchSidebarProvider {
    constructor(extensionUri, secretStorage) {
        this._extensionUri = extensionUri;
        this._secrets = secretStorage;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the sidebar webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'scan':
                    await vscode.commands.executeCommand('react-arch-analyzer.scanWorkspace');
                    this.refreshHistory();
                    break;
                case 'openProject':
                    vscode.commands.executeCommand('react-arch-analyzer.openGraph', data.value);
                    break;
                case 'refresh':
                    this.refreshHistory();
                    break;
            }
        });

        // Load project history on sidebar open
        this.refreshHistory();
    }

    async refreshHistory() {
        if (!this._view) return;
        try {
            const config = vscode.workspace.getConfiguration('react-arch-analyzer');
            const backendUrl = (config.get('backendUrl') || 'https://react-arch-analyzer-backend.onrender.com').replace(/\/$/, '');

            const token = await this._secrets.get(TOKEN_SECRET_KEY);
            if (!token) {
                this._view.webview.postMessage({ type: 'error', value: 'Not logged in. Use "Login" command.' });
                return;
            }

            const runs = await request(`${backendUrl}/api/analysis/`, { token });
            this._view.webview.postMessage({ type: 'history', value: runs });
        } catch (err) {
            this._view.webview.postMessage({ type: 'error', value: 'Backend not running or unreachable' });
        }
    }

    _getHtmlForWebview(webview) {
        const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'sidebar.html');
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css'));
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js'));

        return fs.readFileSync(htmlPath, 'utf8')
            .replace('${cssUri}', cssUri.toString())
            .replace('${jsUri}', jsUri.toString());
    }
}

module.exports = { ReactArchSidebarProvider, TOKEN_SECRET_KEY };
