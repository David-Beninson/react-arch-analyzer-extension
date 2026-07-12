# React Architecture Analyzer 🚀

React Architecture Analyzer is an end-to-end development tool designed to scan, analyze, and visually interact with React component structures and props data flow.

---

## 🏗️ Architecture Overview

The system consists of three main components:

1. **VS Code Extension (`extension/`)**:
   - Recursively scans React files (`.js`, `.jsx`, `.ts`, `.tsx`) in the workspace.
   - Statically parses components, exports, custom and built-in hooks (e.g., `useState`), state variables, and child components with passed props.
   - Sends payload data to the Backend API.

2. **Backend API (`backend/`)**:
   - Built with **FastAPI** (Python 3.12+).
   - Utilizes **Beanie ODM** & **Motor** for asynchronous integration with **MongoDB**.
   - Persists scan history (`AnalysisRun`), components (`CodeComponent`), and component relations (`ComponentRelation`).

3. **Frontend Dashboard (`frontend/`)**:
   - Built using **React + Vite** and Vanilla CSS.
   - Visualizes component structure using **React Flow (`@xyflow/react`)** as an interactive, search-enabled component graph.
   - Displays detailed component cards with their respective hooks, state variables, and props.

---

## 🚀 Running the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.12+)
- [MongoDB](https://www.mongodb.com/) running locally (or MongoDB Atlas connection string)

### 1. Running Backend & Frontend Together
From the root folder, run the following commands:
```bash
# Install root orchestration packages
npm install

# Run both Backend & Frontend concurrently
npm run dev
```
- **Backend API**: Runs on `http://127.0.0.1:8001`
- **Frontend Dashboard**: Runs on `http://localhost:5173`

### 2. Running the VS Code Extension
1. Open the [extension/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/extension) folder in a new VS Code window.
2. Install extension dependencies:
   ```bash
   cd extension
   npm install
   ```
3. Press **F5** to start debugging the extension (this opens an Extension Development Host window).
4. In the new window, open any React codebase.
5. Access the sidebar container for **React Architecture**, or trigger the following commands from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):
   - `React Arch: Scan Workspace and Upload` (Initiates workspace parsing and sends payload to the database).
   - `React Arch: Open Architecture Graph` (Opens the dashboard inside a VS Code webview panel).

---

## 📂 Main Directory Layout

- [backend/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend) - FastAPI application & database layer.
- [frontend/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend) - React Flow web client dashboard.
- [extension/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/extension) - VS Code extension source code and configuration.
