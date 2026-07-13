const fs = require('fs');
const path = require('path');
const { request } = require('./api');

// Directories to skip during recursive scan
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'public']);

// Recursively find all React-related source files
function getFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.has(file)) getFiles(fullPath, filesList);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

// Extract component details, state initialization, and child props from source code
function parseFile(filePath, projectRoot) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(projectRoot, filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    // 1. Detect component name via function or arrow declaration
    const funcMatch = content.match(/(?:export\s+default\s+|export\s+)?function\s+([A-Z]\w*)/);
    const arrowMatch = content.match(/(?:export\s+)?const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);

    let componentName = funcMatch?.[1] || arrowMatch?.[1];
    if (!componentName) {
        if (/^[A-Z]/.test(fileName)) componentName = fileName;
        else if (content.includes('</') || content.includes('/>') || /\<[A-Z]/.test(content))
            componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        else return null; // Not a React component file
    }

    // 2. Detect hooks (useState, useEffect, custom hooks)
    const hooks = [...new Set(content.match(/\buse[A-Z]\w*\b/g) || [])];

    // 3. Detect state variables
    const stateVariables = [...content.matchAll(/const\s+\[\s*(\w+)\s*,\s*\w+\s*\]\s*=\s*useState/g)]
        .map(m => m[1]);

    // 4. Check if component is exported
    const isExported =
        content.includes('export default') ||
        content.includes(`export const ${componentName}`) ||
        content.includes(`export function ${componentName}`);

    // 5. Detect child components and the props passed to each
    const childComponents = [...new Set(
        [...content.matchAll(/<([A-Z]\w*)/g)].map(m => m[1])
    )].filter(n => n !== componentName);

    const relations = childComponents.map(childName => {
        const tagMatches = [...content.matchAll(new RegExp(`<${childName}\\s+([\\s\\S]*?)(?:\\/>>|>)`, 'g'))];
        const seen = new Set();
        const propsPassed = [];

        for (const match of tagMatches) {
            for (const pMatch of match[1].matchAll(/(\w+)(?:\s*=\s*(?:\{[^}]+\}|"[^"]*"|'[^']*'))?/g)) {
                const propName = pMatch[1];
                if (!propName || ['key', 'ref'].includes(propName) || seen.has(propName)) continue;
                seen.add(propName);
                const isCallback = /^on[A-Z]/.test(propName);
                let type = 'unknown';
                if (pMatch[0].includes('={')) type = isCallback ? 'function' : 'expression';
                else if (pMatch[0].includes('="') || pMatch[0].includes("='")) type = 'string';
                else if (!pMatch[0].includes('=')) type = 'boolean';
                propsPassed.push({ name: propName, type, is_callback: isCallback });
            }
        }

        return { parent_name: componentName, child_name: childName, props_passed: propsPassed };
    });

    return {
        component: { name: componentName, file_path: relativePath, is_exported: isExported, hooks, state_variables: stateVariables },
        relations,
    };
}

/**
 * Scan a workspace directory and upload the analysis to the backend.
 * @param {string} targetDir - Absolute path to the project root
 * @param {string} projectName - Human-readable project name
 * @param {string} token - JWT Bearer token from SecretStorage
 * @param {string} [backendUrl] - Backend base URL
 */
async function scanAndUpload(targetDir, projectName, token, backendUrl = 'https://react-arch-analyzer-backend.onrender.com') {
    const absoluteTargetDir = path.resolve(targetDir);
    if (!fs.existsSync(absoluteTargetDir)) throw new Error(`Directory not found: ${absoluteTargetDir}`);

    const components = [];
    const relations = [];

    for (const file of getFiles(absoluteTargetDir)) {
        try {
            const result = parseFile(file, absoluteTargetDir);
            if (result) {
                components.push(result.component);
                relations.push(...result.relations);
            }
        } catch (err) {
            console.error(`Error parsing ${file}:`, err.message);
        }
    }

    console.log(`Scan done. ${components.length} components, ${relations.length} relations.`);

    const data = await request(`${backendUrl.replace(/\/$/, '')}/api/analysis/`, {
        method: 'POST',
        body: JSON.stringify({ project_name: projectName, root_path: absoluteTargetDir, git_commit: null, components, relations }),
        token,
    });

    console.log(`Upload successful! Run ID: ${data.run_id}`);
    return data;
}

module.exports = { scanAndUpload };
