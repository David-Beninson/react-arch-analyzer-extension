# React Architecture Analyzer - Frontend Dashboard 💻

This is the **Frontend Dashboard** for the React Architecture Analyzer. Built with **React** and **Vite**, it provides a visualization platform for mapping React component flows.

---

## 🛠️ Tech Stack
- **React (v18+)**: Main UI library.
- **Vite**: Rapid-build frontend bundler.
- **React Flow (`@xyflow/react`)**: Interactive node-graph engine.
- **React Router Dom (v6)**: Declarative routing system.
- **Axios**: HTTP client.

---

## 📂 Directory Layout (`src`)

- [components/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend/src/components) - Custom, reusable layout items:
  - `Common/`: Shell layout (`Layout`).
  - `ProjectGraph/`:
    - `index.jsx`: Wraps and builds the nodes and connections configuration.
    - `NodeCard.jsx`: Reusable custom graph node representing individual React components.
    - `EdgeCustom.jsx`: Custom connection line showing prop details on hover.
  - `ui/`: Generic UI inputs, indicators, buttons.
- [context/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend/src/context) - React global Context wrappers (projects index and tree configurations).
- [hooks/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend/src/hooks) - React hooks.
- [pages/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend/src/pages) - Main route views (Home, Dashboard, NewProject, NotFound).
- [utils/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/frontend/src/utils) - Logic utility helpers, localstorage setups, and node layout calculators.
- `App.jsx` - Root router settings.
- `main.jsx` - Entrypoint initialization.

---

## ⚙️ Standalone Setup & Execution

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables:**
   Configure target local/production API address inside `.env`:
   ```env
   VITE_API_URL=http://localhost:8001
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Access client at `http://localhost:5173/`.
