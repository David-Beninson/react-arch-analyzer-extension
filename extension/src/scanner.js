const fs = require('fs');
const path = require('path');
const { request } = require('./api');

// Recursively find all React-related source files
function getFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'public'].some(ignore => file.includes(ignore))) {
                continue;
            }
            getFiles(name, filesList);
        } else {
            if (/\.(js|jsx|ts|tsx)$/.test(file)) {
                filesList.push(name);
            }
        }
    }
    return filesList;
}

// Extract component details, state initialization, and child props from source code
function parseFile(filePath, projectRoot) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(projectRoot, filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    // 1. Detect Component Name
    let componentName = null;
    const funcMatch = content.match(/(?:export\s+default\s+|export\s+)?function\s+([A-Z]\w*)/);
    const arrowMatch = content.match(/(?:export\s+)?const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);

    if (funcMatch) {
        componentName = funcMatch[1];
    } else if (arrowMatch) {
        componentName = arrowMatch[1];
    } else {
        // Fallback: If filename starts with uppercase letter (e.g. Card.jsx)
        if (/^[A-Z]/.test(fileName)) {
            componentName = fileName;
        }
    }

    if (!componentName) {
        // Fallback: If it's a JS/JSX entry point rendering JSX elements (like main.jsx), name it after the file
        if (content.includes('</') || content.includes('/>') || /<[A-Z]/.test(content)) {
            componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        } else {
            return null; // Not a React component file
        }
    }

    // 2. Detect Hooks (useState, useEffect, custom Hooks)
    const hooksMatches = content.match(/\buse[A-Z]\w*\b/g) || [];
    const hooks = [...new Set(hooksMatches)];

    // 3. Detect State variables
    const stateMatches = [...content.matchAll(/const\s+\[\s*(\w+)\s*,\s*\w+\s*\]\s*=\s*useState/g)];
    const stateVariables = stateMatches.map(m => m[1]);

    // 4. Check if component is exported
    const isExported = content.includes('export default') || 
                      content.includes(`export const ${componentName}`) || 
                      content.includes(`export function ${componentName}`);

    // 5. Detect child components rendered inside JSX
    const childTagsMatches = [...content.matchAll(/<([A-Z]\w*)/g)];
    const childComponents = [...new Set(childTagsMatches.map(m => m[1]))].filter(name => name !== componentName);

    // 6. Inspect props passed to each child component
    const relations = [];
    childComponents.forEach(childName => {
        const tagRegex = new RegExp(`<${childName}\\s+([\\s\\S]*?)(?:\\/>|>)`, 'g');
        const tagMatches = [...content.matchAll(tagRegex)];
        
        const propsPassed = [];
        tagMatches.forEach(match => {
            const propsStr = match[1];
            const propRegex = /(\w+)(?:\s*=\s*(?:\{[^}]+\}|"[^"]*"|'[^']*'))?/g;
            const propMatches = [...propsStr.matchAll(propRegex)];
            
            propMatches.forEach(pMatch => {
                const propName = pMatch[1];
                if (propName && !['key', 'ref'].includes(propName)) {
                    const isCallback = /^on[A-Z]/.test(propName);
                    let typeGuess = "unknown";
                    if (pMatch[0].includes('={')) {
                        typeGuess = isCallback ? "function" : "expression";
                    } else if (pMatch[0].includes('="') || pMatch[0].includes("='")) {
                        typeGuess = "string";
                    } else if (!pMatch[0].includes('=')) {
                        typeGuess = "boolean";
                    }
                    
                    propsPassed.push({
                        name: propName,
                        type: typeGuess,
                        is_callback: isCallback
                    });
                }
            });
        });

        // Deduplicate props passed to the same child
        const uniqueProps = [];
        const seenProps = new Set();
        propsPassed.forEach(p => {
            if (!seenProps.has(p.name)) {
                seenProps.add(p.name);
                uniqueProps.push(p);
            }
        });

        relations.push({
            parent_name: componentName,
            child_name: childName,
            props_passed: uniqueProps
        });
    });

    return {
        component: {
            name: componentName,
            file_path: relativePath,
            is_exported: isExported,
            hooks: hooks,
            state_variables: stateVariables
        },
        relations: relations
    };
}

// Scan workspace directory and upload results to backend using DRY api client
async function scanAndUpload(targetDir, projectName, backendUrl = 'https://react-arch-analyzer-backend.onrender.com') {
    const absoluteTargetDir = path.resolve(targetDir);
    console.log(`Starting scan of ${absoluteTargetDir}...`);

    if (!fs.existsSync(absoluteTargetDir)) {
        throw new Error(`Directory ${absoluteTargetDir} does not exist.`);
    }

    const files = getFiles(absoluteTargetDir);
    const components = [];
    const relations = [];

    files.forEach(file => {
        try {
            const result = parseFile(file, absoluteTargetDir);
            if (result) {
                components.push(result.component);
                relations.push(...result.relations);
            }
        } catch (err) {
            console.error(`Error parsing file ${file}:`, err.message);
        }
    });

    console.log(`Scan completed. Found ${components.length} components and ${relations.length} relations.`);

    const payload = {
        project_name: projectName,
        root_path: absoluteTargetDir,
        git_commit: null,
        components: components,
        relations: relations
    };

    console.log(`Uploading to backend at ${backendUrl}/api/analysis/...`);
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    const data = await request(`${cleanBackendUrl}/api/analysis/`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    console.log(`Upload successful! Run ID: ${data.run_id}`);
    return data;
}

module.exports = { scanAndUpload, parseFile, getFiles };
