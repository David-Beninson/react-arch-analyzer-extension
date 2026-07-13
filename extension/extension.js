const vscode = require('vscode');
const ReactArchSidebarProvider = require('./src/sidebarProvider');
const { scanAndUpload } = require('./src/scanner');

function activate(context) {
    console.log('React Architecture Analyzer extension is now active!');

    // 1. Register: Command to Scan Workspace
    let scanDisposable = vscode.commands.registerCommand('react-arch-analyzer.scanWorkspace', async function () {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace open to scan.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const projectName = vscode.workspace.name || 'Unnamed Project';

        // Read backendUrl from VS Code Settings
        const config = vscode.workspace.getConfiguration('react-arch-analyzer');
        const backendUrl = config.get('backendUrl') || 'https://react-arch-analyzer-backend.onrender.com';

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "React Architecture Analyzer",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Scanning files..." });
            try {
                await scanAndUpload(rootPath, projectName, backendUrl);
                vscode.window.showInformationMessage(`Scan successfully completed and uploaded to ${backendUrl}!`);
            } catch (err) {
                vscode.window.showErrorMessage(`Scan failed: ${err.message}`);
            }
        });
    });

    // 2. Register: Command to Open Graph Webview Panel
    let openGraphDisposable = vscode.commands.registerCommand('react-arch-analyzer.openGraph', function (projectName) {
        const config = vscode.workspace.getConfiguration('react-arch-analyzer');
        const frontendUrl = (config.get('frontendUrl') || 'https://react-arch-analyzer-frontend.vercel.app').replace(/\/$/, '');

        const panel = vscode.window.createWebviewPanel(
            'reactArchGraph',
            `React Graph: ${projectName || 'View'}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Point the Webview to our React Frontend (running locally or globally)
        const targetUrl = projectName
            ? `${frontendUrl}/dashboard/${encodeURIComponent(projectName)}`
            : `${frontendUrl}/`;

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${frontendUrl} https://react-arch-analyzer-frontend.vercel.app http://localhost:5173 http://127.0.0.1:5173; style-src 'unsafe-inline';">
                <title>React Architecture Graph</title>
                <style>
                    html, body, iframe {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        border: none;
                        background-color: transparent;
                    }
                </style>
            </head>
            <body>
                <iframe src="${targetUrl}"></iframe>
            </body>
            </html>
        `;
    });

    // 3. Register: Sidebar Webview Provider
    const sidebarProvider = new ReactArchSidebarProvider(context.extensionUri);
    let sidebarDisposable = vscode.window.registerWebviewViewProvider(
        'react-arch-analyzer-view',
        sidebarProvider
    );

    context.subscriptions.push(scanDisposable, openGraphDisposable, sidebarDisposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
