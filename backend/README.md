# React Architecture Analyzer - Backend API 🐍

This is the **Backend API** for the React Architecture Analyzer. It provides database storage management for parsed components and relationships and serves APIs for the frontend dashboard to display history and graphs.

---

## 🛠️ Technology Stack
- **FastAPI**: Modern, high-performance web framework for Python APIs.
- **Beanie ODM**: Asynchronous ODM for MongoDB, built on top of Pydantic and Motor.
- **Motor**: Official async MongoDB driver for Python.
- **Pydantic**: Data validation and settings management.
- **Uvicorn**: Lightning-fast ASGI server implementation.
- **Python 3.12+**.

---

## 📂 Directory Structure

- [models/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend/models) - Beanie Document models mapping to MongoDB:
  - `AnalysisRun.py`: Holds details about a scan event.
  - `CodeComponent.py`: Details metadata of a React component (e.g., file path, hooks, state variables).
  - `ComponentRelation.py`: Maps hierarchy between components and details props passed from parent to child.
- [routes/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend/routes) - FastAPI routes:
  - `analysis.py`: Handles endpoints to create new runs, fetch list of runs, or details of a run.
- [schemas/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend/schemas) - Pydantic validation schemas.
- [services/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend/services) - Handles database queries and coordinates service operations.
- [utils/](file:///Users/mrjimmyy/Projects/vs_code_react_prop_extention/backend/utils) - Utility functions (serialization tools for MongoDB models).
- `main.py` - FastAPI configuration, lifespan events, middleware setups, and routing.
- `.env` - Environment configuration.

---

## ⚙️ Standalone Setup & Execution

1. **Environment Setup:**
   Ensure a `.env` file exists in the `/backend` directory:
   ```env
   MONGODB_URI_DEV=mongodb://localhost:27017
   HOST=127.0.0.1
   PORT=8001
   ```

2. **Install & Run Backend:**
   Use the `uv` tool to manage dependencies and launch the dev environment:
   ```bash
   cd backend
   uv run --python 3.12 python main.py
   ```

3. **Check Connection:**
   The backend runs on `http://127.0.0.1:8001`.
   To view Swagger API docs, navigate to `http://127.0.0.1:8001/docs`.
