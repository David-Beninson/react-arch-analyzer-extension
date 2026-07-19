const vscode = require('vscode');
const { ReactArchSidebarProvider, TOKEN_SECRET_KEY } = require('./src/sidebarProvider');
const { scanAndUpload, scanLocal } = require('./src/scanner');
const { request } = require('./src/api');

function getBackendUrl() {
    const config = vscode.workspace.getConfiguration('react-arch-analyzer');
    return (config.get('backendUrl') || 'https://react-arch-analyzer-backend.onrender.com').replace(/\/$/, '');
}

/**
 * Sign the user in via their existing GitHub account in VS Code.
 * Uses vscode.authentication to obtain a GitHub access token without
 * any email/password prompt, then exchanges it for our own JWT.
 *
 * @param {vscode.ExtensionContext} context
 */
async function handleGitHubSignIn(context) {
    try {
        // Request a GitHub session — VS Code handles the OAuth popup/consent
        // 'read:user' gives us the profile; 'user:email' gives the primary email
        const session = await vscode.authentication.getSession(
            'github',
            ['read:user', 'user:email'],
            { createIfNone: true }
        );

        if (!session) {
            vscode.window.showWarningMessage('GitHub sign-in was cancelled.');
            return;
        }

        // Exchange the GitHub access token for our own backend JWT
        const data = await request(`${getBackendUrl()}/api/auth/github`, {
            method: 'POST',
            body: JSON.stringify({ access_token: session.accessToken }),
        });

        // Store the JWT securely — the webview will pick it up via ?vstoken=
        await context.secrets.store(TOKEN_SECRET_KEY, data.access_token);

        vscode.window.showInformationMessage(
            `Signed in as ${session.account.label} — welcome!`
        );
    } catch (err) {
        vscode.window.showErrorMessage(`GitHub sign-in failed: ${err.message}`);
    }
}

let activeGraphPanel = undefined;
let pendingLocalData = null;

function getWorkspaceInfo() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace open to scan.');
        return null;
    }
    return {
        rootPath: workspaceFolders[0].uri.fsPath,
        projectName: vscode.workspace.name || 'Unnamed Project'
    };
}

function activate(context) {
    console.log('React Architecture Analyzer extension is now active!');

    // 1. Sign in — uses the GitHub account already connected in VS Code
    const signInDisposable = vscode.commands.registerCommand(
        'react-arch-analyzer.signIn',
        () => handleGitHubSignIn(context)
    );

    // 2. Logout — removes the stored JWT
    const logoutDisposable = vscode.commands.registerCommand(
        'react-arch-analyzer.logout',
        async () => {
            await context.secrets.delete(TOKEN_SECRET_KEY);
            vscode.window.showInformationMessage('Signed out successfully.');
        }
    );

    // 3. Scan workspace — requires a stored JWT
    const scanDisposable = vscode.commands.registerCommand(
        'react-arch-analyzer.scanWorkspace',
        async () => {
            const token = await context.secrets.get(TOKEN_SECRET_KEY);
            if (!token) {
                // Auto-sign-in before scanning if not authenticated
                await handleGitHubSignIn(context);
            }

            // Re-check after potential sign-in attempt
            const freshToken = await context.secrets.get(TOKEN_SECRET_KEY);
            if (!freshToken) return;

            const wsInfo = getWorkspaceInfo();
            if (!wsInfo) return;
            const { rootPath, projectName } = wsInfo;

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'React Architecture Analyzer',
                    cancellable: false,
                },
                async (progress) => {
                    progress.report({ message: 'Scanning files...' });
                    try {
                        await scanAndUpload(rootPath, projectName, freshToken, getBackendUrl());
                        vscode.window.showInformationMessage('Scan completed and uploaded!');
                    } catch (err) {
                        vscode.window.showErrorMessage(`Scan failed: ${err.message}`);
                    }
                }
            );
        }
    );

    // 3b. Scan workspace locally — local-first analysis without any server uploads/logins
    const scanLocalDisposable = vscode.commands.registerCommand(
        'react-arch-analyzer.scanLocal',
        async () => {
            const wsInfo = getWorkspaceInfo();
            if (!wsInfo) return;
            const { rootPath, projectName } = wsInfo;

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'React Architecture Analyzer (Local Scan)',
                    cancellable: false,
                },
                async (progress) => {
                    progress.report({ message: 'Analyzing local files...' });
                    try {
                        const localData = await scanLocal(rootPath, projectName);
                        
                        pendingLocalData = {
                            projectName,
                            components: localData.components,
                            relations: localData.relations
                        };

                        if (!activeGraphPanel) {
                            await vscode.commands.executeCommand('react-arch-analyzer.openGraph', 'local');
                        } else {
                            activeGraphPanel.webview.postMessage({
                                type: 'LOAD_LOCAL_DATA',
                                value: pendingLocalData
                            });
                            pendingLocalData = null; // consume it
                        }

                        vscode.window.showInformationMessage('Local analysis completed!');
                    } catch (err) {
                        vscode.window.showErrorMessage(`Local scan failed: ${err.message}`);
                    }
                }
            );
        }
    );

    // 4. Open graph webview panel
    const openGraphDisposable = vscode.commands.registerCommand(
        'react-arch-analyzer.openGraph',
        async (projectInfo) => {
            const config = vscode.workspace.getConfiguration('react-arch-analyzer');
            const frontendUrl = (
                config.get('frontendUrl') || 'https://react-arch-analyzer-frontend.vercel.app'
            ).replace(/\/$/, '');

            let projectId = '';
            let panelTitle = 'React Graph: View';

            if (projectInfo) {
                if (typeof projectInfo === 'object') {
                    projectId = projectInfo.id;
                    panelTitle = `React Graph: ${projectInfo.name}`;
                } else {
                    projectId = projectInfo;
                    panelTitle = `React Graph: ${projectInfo}`;
                }
            }

            if (activeGraphPanel) {
                activeGraphPanel.reveal(vscode.ViewColumn.One);
                if (projectId === 'local' && pendingLocalData) {
                    activeGraphPanel.webview.postMessage({
                        type: 'LOAD_LOCAL_DATA',
                        value: pendingLocalData
                    });
                    pendingLocalData = null;
                }
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'reactArchGraph',
                panelTitle,
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );

            activeGraphPanel = panel;

            panel.onDidDispose(() => {
                activeGraphPanel = undefined;
            });

            // Listen for messages from webview (like iframeReady)
            panel.webview.onDidReceiveMessage(async (message) => {
                if (message.type === 'iframeReady') {
                    if (pendingLocalData) {
                        panel.webview.postMessage({
                            type: 'LOAD_LOCAL_DATA',
                            value: pendingLocalData
                        });
                        pendingLocalData = null;
                    }
                }
            });

            const token = await context.secrets.get(TOKEN_SECRET_KEY);
            const basePath = projectId ? `/dashboard/${encodeURIComponent(projectId)}` : '/';

            // Append the JWT as a query param so the frontend can authenticate the iframe
            const targetUrl = token
                ? `${frontendUrl}${basePath}?vstoken=${encodeURIComponent(token)}`
                : `${frontendUrl}${basePath}`;

            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${frontendUrl} https://react-arch-analyzer-frontend.vercel.app http://localhost:5173 http://127.0.0.1:5173; style-src 'unsafe-inline';">
                    <title>React Architecture Graph</title>
                    <style>html, body, iframe { margin: 0; padding: 0; width: 100%; height: 100%; border: none; background: transparent; }</style>
                </head>
                <body>
                    <iframe src="${targetUrl}"></iframe>
                    <script>
                        const vscode = acquireVsCodeApi();
                        const iframe = document.querySelector('iframe');
                        
                        // 1. Forward messages from VS Code Extension to iframe
                        window.addEventListener('message', (event) => {
                            if (event.data) {
                                iframe.contentWindow.postMessage(event.data, '*');
                            }
                        });

                        // 2. Forward messages from iframe to VS Code Extension
                        window.addEventListener('message', (event) => {
                            if (event.source === iframe.contentWindow) {
                                vscode.postMessage(event.data);
                            }
                        });

                        // 3. Inform VS Code when iframe loads
                        iframe.onload = () => {
                            vscode.postMessage({ type: 'iframeReady' });
                        };
                    </script>
                </body>
                </html>
            `;
        }
    );

    // 5. Sidebar provider — receives SecretStorage for token-based history
    const sidebarProvider = new ReactArchSidebarProvider(context.extensionUri, context.secrets);
    const sidebarDisposable = vscode.window.registerWebviewViewProvider(
        'react-arch-analyzer-view',
        sidebarProvider
    );

    context.subscriptions.push(
        signInDisposable,
        logoutDisposable,
        scanDisposable,
        scanLocalDisposable,
        openGraphDisposable,
        sidebarDisposable
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
