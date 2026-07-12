import { transformToHierarchy } from "./treeHelpers.js";
import { api } from "./api.js";



export async function processProjectData(projectName, signal) {
    const flatPropsList = [];
    let runId = projectName;

    if (!/^[0-9a-fA-F]{24}$/.test(projectName)) {
        const listRes = await api.get("/api/analysis/", { signal });

        const matchingRun = listRes.data
            .filter(r => r.project_name.toLowerCase() === projectName.toLowerCase())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (!matchingRun) throw new Error("Project not found locally or on the server.");
        runId = matchingRun._id;
    };

    const { data } = await api.get(`/api/analysis/${runId}`, { signal });

    const nameToPath = {};
    const allComponentsList = [];
    if (data.components) {
        data.components.forEach(c => {
            nameToPath[c.name] = c.file_path;
            allComponentsList.push(c.file_path);
        });
    }
    
    const legacyTree = {};

    data.relations.forEach(r => {
        const parentPath = nameToPath[r.parent_name] || r.parent_name;
        const childPath = nameToPath[r.child_name] || r.child_name;

        if (!legacyTree[parentPath]) legacyTree[parentPath] = [];
        if (!legacyTree[parentPath].includes(childPath)) {
            legacyTree[parentPath].push(childPath);
        };

        r.props_passed.forEach(p => {
            flatPropsList.push({ childPath, propName: p.name });
        });
    });

    const formatTree = transformToHierarchy(legacyTree, allComponentsList);

    return { formatTree, flatPropsList };
};