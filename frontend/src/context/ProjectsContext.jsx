import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
    loadSavedProjects,
    saveProjectToStorage,
    deleteProjectFromStorage
} from "../utils/localStorageUtils";
import { api } from "../utils/api";

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {

    const [projects, setProjects] = useState(() => loadSavedProjects());

    useEffect(() => {
        const controller = new AbortController();

        async function fetchBackendRuns() {
            try {
                const res = await api.get("/api/analysis/", { signal: controller.signal });
                const runs = res.data || [];

                const backendProjectNames = runs.map(r => r.project_name);

                setProjects(prev => {
                    const all = new Set([
                        ...prev,
                        ...backendProjectNames
                    ]);
                    return [...all];
                });

            } catch (error) {
                if (axios.isCancel(error)) {
                    return;
                }
                console.error("Failed to load project runs from backend:", error);
            };
        };

        fetchBackendRuns();

        return () => controller.abort();
    }, []);

    const saveProject = useCallback((key, data) => {
        setProjects(prev => saveProjectToStorage(key, data, prev));
    }, []);

    const deleteProject = useCallback((key) => {
        setProjects(prev => deleteProjectFromStorage(key, prev));
    }, []);

    const contextValue = useMemo(() => ({
        projects,
        saveProject,
        deleteProject
    }), [projects, saveProject, deleteProject]);

    return (
        <ProjectsContext.Provider value={contextValue}>
            {children}
        </ProjectsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useProjects() {
    const context = useContext(ProjectsContext);

    if (!context) {
        throw new Error("useProjects must be used within a ProjectsProvider");
    }
    return context;
};
