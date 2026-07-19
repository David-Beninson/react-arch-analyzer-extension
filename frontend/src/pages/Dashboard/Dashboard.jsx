import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTreeDiagram } from "../../context/TreeContext";
import { useProjects } from "../../context/ProjectsContext";
import { usePropsActions } from "../../hooks/usePropsActions";
import { getLocalStorageItem } from '../../utils/localStorageUtils';
import { processProjectData, processLocalData } from "../../utils/projectDataHelper";
import ArchitectureGraph from "../../components/ProjectGraph";
import "./Dashboard.css";


export default function Dashboard() {
    const { treeDiagram, setTreeDiagram } = useTreeDiagram();
    const { projectName } = useParams();
    const { projects } = useProjects();
    const [isLoading, setIsLoading] = useState(false);
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [localProjectName, setLocalProjectName] = useState("Local Project");
    const { addProp, resetProps } = usePropsActions();

    // Listen for offline/local data from the VS Code extension
    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message && message.type === 'LOAD_LOCAL_DATA') {
                const { projectName: name, components, relations } = message.value;
                setIsLocalMode(true);
                setLocalProjectName(name || "Local Project");
                setIsLoading(true);

                try {
                    const { formatTree, flatPropsList } = processLocalData({ components, relations });
                    resetProps();
                    (flatPropsList || []).forEach(({ childPath, propName }) => {
                        addProp(childPath, propName);
                    });
                    setTreeDiagram(formatTree);
                } catch (error) {
                    console.error("Local data processing error:", error);
                    setTreeDiagram(null);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [addProp, resetProps, setTreeDiagram]);

    // Handle traditional URL/API project loading
    useEffect(() => {
        if (!projectName) {
            setTreeDiagram(null);
            return;
        }

        if (projectName === 'local') {
            setIsLocalMode(true);
            return;
        }

        setIsLocalMode(false);
        const savedTree = getLocalStorageItem(projectName);

        if (savedTree) {
            setTreeDiagram(savedTree);
            return;
        }

        const controller = new AbortController();

        async function initProjectLoad() {
            setIsLoading(true);
            try {
                const { formatTree, flatPropsList } =
                    await processProjectData(projectName, controller.signal);

                resetProps();
                (flatPropsList || []).forEach(({ childPath, propName }) => {
                    addProp(childPath, propName);
                });
                setTreeDiagram(formatTree);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error("Backend load error:", error);
                    setTreeDiagram(null);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }
        initProjectLoad();
        return () => controller.abort();
    }, [projectName, setTreeDiagram, addProp, resetProps]);

    if (isLoading) {
        return <div className="loadingContainer">Loading...</div>;
    }

    if (!treeDiagram) {
        return (
            <div className="no-project-view">
                {isLocalMode ? (
                    <div className="waiting-container">
                        <div className="waiting-spinner">⏳</div>
                        <h2>Waiting for VS Code local scan...</h2>
                        <p>Please run the <strong>React Arch: Scan Workspace Locally (Offline)</strong> command in VS Code.</p>
                    </div>
                ) : (
                    <div className="no-project-content">
                        <h2>No project loaded</h2>
                        {projects.length > 0 && (
                            <div className="savedProjectsContainer">
                                <p className="savedProjectsLabel">Or load a saved project:</p>
                                <div className="savedProjectsList">
                                    {projects.map(name => (
                                        <Link key={name} to={`/dashboard/${name}`} className="btn savedProjectLink">
                                            {name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const displayProjectName = isLocalMode ? localProjectName : projectName;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Project: {displayProjectName}</h2>
                <span className={`mode-badge ${isLocalMode ? 'local' : 'cloud'}`}>
                    {isLocalMode ? '🟢 Local Mode' : '☁️ Cloud Mode'}
                </span>
            </div>
            <ArchitectureGraph treeDiagram={treeDiagram} />
        </div>
    );
};