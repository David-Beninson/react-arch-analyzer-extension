import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTreeDiagram } from "../../context/TreeContext";
import { useProjects } from "../../context/ProjectsContext";
import { usePropsActions } from "../../hooks/usePropsActions";
import { getLocalStorageItem } from '../../utils/localStorageUtils';
import { processProjectData } from "../../utils/projectDataHelper";
import ArchitectureGraph from "../../components/ProjectGraph";
import "./Dashboard.css";


export default function Dashboard() {
    const { treeDiagram, setTreeDiagram } = useTreeDiagram();
    const { projectName } = useParams();
    const { projects } = useProjects();
    const [isLoading, setIsLoading] = useState(false);
    const { addProp, resetProps } = usePropsActions();

    useEffect(() => {
        if (!projectName) {
            setTreeDiagram(null);
            return;
        };

        const savedTree = getLocalStorageItem(projectName);

        if (savedTree) {
            setTreeDiagram(savedTree);
            return;
        };

        const controller = new AbortController();

        async function initProjectLoad() {
            setIsLoading(true);

            try {
                const { formatTree, flatPropsList } =
                    await processProjectData(projectName, controller.signal);

                resetProps();
                (flatPropsList || []).forEach((
                    { childPath, propName }) => {
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
                };
            };
        };
        initProjectLoad();
        return () => controller.abort();

    }, [projectName, setTreeDiagram, addProp, resetProps]);

    if (isLoading) {
        return <div className="loadingContainer">Loading...</div>;
    };

    if (!treeDiagram) {
        return (
            <div className="no-project-view">
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
        );
    };

    return (
        <div className="dashboard-container">
            <h2>Project: {projectName}</h2>
            <ArchitectureGraph treeDiagram={treeDiagram} />
        </div>
    );
};