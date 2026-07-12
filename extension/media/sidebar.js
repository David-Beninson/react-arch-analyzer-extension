const vscode = acquireVsCodeApi();

document.getElementById('scanBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'scan' });
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'refresh' });
});

window.addEventListener('message', event => {
    const message = event.data;
    const list = document.getElementById('historyList');
    
    if (message.type === 'history') {
        list.innerHTML = '';
        if (message.value.length === 0) {
            list.innerHTML = '<div class="empty-text">No scans found in database</div>';
            return;
        }
        
        // Sort by date desc
        message.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        message.value.forEach(run => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.addEventListener('click', () => {
                vscode.postMessage({ type: 'openProject', value: run.project_name });
            });
            
            const dateStr = new Date(run.created_at).toLocaleDateString();
            item.innerHTML = `
                <span class="project-name">${run.project_name}</span>
                <span class="project-date">${dateStr}</span>
            `;
            list.appendChild(item);
        });
    } else if (message.type === 'error') {
        list.innerHTML = `<div class="error-text">${message.value}</div>`;
    }
});
