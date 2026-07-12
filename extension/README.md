# React Architecture Analyzer - VS Code Extension 🔌

This is the **VS Code Extension** codebase for the React Architecture Analyzer. It extracts React component properties and relations from codebases, uploads them, and embeds interactive diagrams in VS Code.

---

## 🛠️ Key Features
- **Project Scanner**: Searches `.js`, `.jsx`, `.ts`, `.tsx` files inside workspaces, skipping directories like `node_modules`, `.git`, etc.
- **Static Parser**:
  - Detects component declarations.
  - Identifies state variables and hooks.
  - Maps parent-child relations and analyzes types of properties passed to children.
- **Sidebar view**: Lists scanned projects and runs scans.
- **Integrated Graph View**: Opens a customized webview showing the diagram inside VS Code.

---

## 📂 Directory Layout

- [media/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/extension/media) - Web assets for sidebar display:
  - `sidebar.html`: Sidebar UI template.
  - `sidebar.css`: Styling for the sidebar interface.
  - `sidebar.js`: Event handler passing UI events to the extension host.
  - `icon.svg`: Activity bar menu icon.
- [src/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/extension/src) - Backend integration and file parsing logic:
  - `api.js`: Dependency-free node HTTP client helper.
  - `scanner.js`: Static regex-based code analyzer.
  - `sidebarProvider.js`: Registers the WebviewViewProvider for UI event handling.
- `extension.js` - Extension entry point registering triggers, context actions, commands, and options.
- `package.json` - Declares activations, configuration menus, custom VS Code attributes, and dev dependencies.

---

## ⚙️ Development Guide

1. **Install Dependencies:**
   ```bash
   cd extension
   npm install
   ```

2. **Run and Debug:**
   - Open `/extension` in VS Code.
   - Press **F5** to launch an Extension Development Host window.

3. **Scan Workspace:**
   - Open a React workspace in the debug window.
   - Open the **React Architecture** sidebar panel and select **Scan Workspace**.
