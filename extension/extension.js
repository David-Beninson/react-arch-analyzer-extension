const vscode = require('vscode');
const { ReactArchSidebarProvider, TOKEN_SECRET_KEY } = require('./src/sidebarProvider');
const { scanAndUpload } = require('./src/scanner');
const { request } = require('./src/api');

function getBackendUrl() {
    const config = vscode.workspace.getConfiguration('react-arch-analyzer');
    return (config.get('backendUrl') || 'https://react-arch-analyzer-backend.onrender.com').replace(/\/$/, '');
}

/**
 * Prompts user for email and password, sends auth request, and saves JWT in SecretStorage.
 * @param {vscode.ExtensionContext} context
 * @param {'login' | 'register'} mode
 */
async function handleAuth(context, mode) {
    const email = await vscode.window.showInputBox({ prompt: 'Email', ignoreFocusOut: true });
    if (!email) return;

    const password = await vscode.window.showInputBox({ prompt: 'Password', password: true, ignoreFocusOut: true });
    if (!password) return;

    const isLogin = mode === 'login';
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const successMsg = isLogin ? 'Logged in successfully!' : 'Account created and logged in!';
    const failPrefix = isLogin ? 'Login failed' : 'Registration failed';

    try {
        const data = await request(`${getBackendUrl()}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await context.secrets.store(TOKEN_SECRET_KEY, data.access_token);
        vscode.window.showInformationMessage(successMsg);
    } catch (err) {
        vscode.window.showErrorMessage(`${failPrefix}: ${err.message}`);
    }
}

function activate(context) {
    console.log('React Architecture Analyzer extension is now active!');

    // 1. Login command — prompts for credentials and stores the JWT securely
    const loginDisposable = vscode.commands.registerCommand('react-arch-analyzer.login', () => handleAuth(context, 'login'));

    // 2. Register command — creates a new account then stores the JWT
    const registerDisposable = vscode.commands.registerCommand('react-arch-analyzer.register', () => handleAuth(context, 'register'));

    // 3. Logout command — removes the stored JWT
    const logoutDisposable = vscode.commands.registerCommand('react-arch-analyzer.logout', async () => {
        await context.secrets.delete(TOKEN_SECRET_KEY);
        vscode.window.showInformationMessage('Logged out.');
    });

    // 4. Scan workspace — requires a stored token
    const scanDisposable = vscode.commands.registerCommand('react-arch-analyzer.scanWorkspace', async () => {
        const token = await context.secrets.get(TOKEN_SECRET_KEY);
        if (!token) {
            vscode.window.showErrorMessage('Please log in first (Run "React Arch: Login").');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace open to scan.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const projectName = vscode.workspace.name || 'Unnamed Project';

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'React Architecture Analyzer', cancellable: false },
            async (progress) => {
                progress.report({ message: 'Scanning files...' });
                try {
                    await scanAndUpload(rootPath, projectName, token, getBackendUrl());
                    vscode.window.showInformationMessage(`Scan completed and uploaded!`);
                } catch (err) {
                    vscode.window.showErrorMessage(`Scan failed: ${err.message}`);
                }
            }
        );
    });

    // 5. Open graph webview panel
    const openGraphDisposable = vscode.commands.registerCommand('react-arch-analyzer.openGraph', async (projectInfo) => {
        const config = vscode.workspace.getConfiguration('react-arch-analyzer');
        const frontendUrl = (config.get('frontendUrl') || 'https://react-arch-analyzer-frontend.vercel.app').replace(/\/$/, '');

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

        const panel = vscode.window.createWebviewPanel(
            'reactArchGraph', panelTitle, vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const token = await context.secrets.get(TOKEN_SECRET_KEY);
        const basePath = projectId ? `/dashboard/${encodeURIComponent(projectId)}` : '/';
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
            <body><iframe src="${targetUrl}"></iframe></body>
            </html>
        `;
    });

    // 6. Sidebar provider — receives SecretStorage for token-based history
    const sidebarProvider = new ReactArchSidebarProvider(context.extensionUri, context.secrets);
    const sidebarDisposable = vscode.window.registerWebviewViewProvider('react-arch-analyzer-view', sidebarProvider);

    context.subscriptions.push(loginDisposable, registerDisposable, logoutDisposable, scanDisposable, openGraphDisposable, sidebarDisposable);
}

function deactivate() { }

module.exports = { activate, deactivate };
