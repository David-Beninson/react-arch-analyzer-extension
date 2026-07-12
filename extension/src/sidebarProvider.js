const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { request } = require('./api');

class ReactArchSidebarProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
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

        // Load project history on start
        this.refreshHistory();
    }

    async refreshHistory() {
        if (!this._view) return;
        try {
            const config = vscode.workspace.getConfiguration('react-arch-analyzer');
            const backendUrl = (config.get('backendUrl') || 'http://127.0.0.1:8001').replace(/\/$/, '');
            
            const runs = await request(`${backendUrl}/api/analysis/`);
            this._view.webview.postMessage({ type: 'history', value: runs });
        } catch (err) {
            this._view.webview.postMessage({ type: 'error', value: 'Backend not running or unreachable' });
        }
    }

    _getHtmlForWebview(webview) {
        const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'sidebar.html');
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css'));
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js'));

        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Clean dynamic replacement of URIs inside the loaded HTML template
        html = html
            .replace('${cssUri}', cssUri.toString())
            .replace('${jsUri}', jsUri.toString());

        return html;
    }
}

module.exports = ReactArchSidebarProvider;
