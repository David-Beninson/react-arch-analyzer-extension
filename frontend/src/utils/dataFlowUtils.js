const collectConnected = (nodeId, map) => {
    const visited = new Set([nodeId]);
    const traverse = (current) => {
        (map[current] || []).forEach(next => {
            if (!visited.has(next)) {
                visited.add(next);
                traverse(next);
            }
        });
    };
    traverse(nodeId);
    return visited;
};

const traverseHierarchy = (hierarchy) => {
    const childrenMap = {}, depthMap = {};
    const visit = (node, depth) => {
        if (!node) return;
        depthMap[node.id] = Math.min(depthMap[node.id] ?? Infinity, depth);
        childrenMap[node.id] = childrenMap[node.id] || [];

        (node.children || []).forEach(child => {
            if (!childrenMap[node.id].includes(child.id)) childrenMap[node.id].push(child.id);
            visit(child, depth + 1);
        });
    };
    hierarchy.forEach(root => visit(root, 0));
    return { childrenMap, depthMap };
};

const findLCA = (nodeIds, parentMap, depthMap) => {
    if (!nodeIds?.length) return null;
    if (nodeIds.length === 1) return nodeIds[0];

    let common = null;
    nodeIds.forEach(id => {
        const ancestors = collectConnected(id, parentMap);
        common = common ? new Set([...common].filter(x => ancestors.has(x))) : ancestors;
    });

    if (!common || common.size === 0) return null;

    return [...common].reduce((deepest, current) =>
        (depthMap[current] ?? 0) > (depthMap[deepest] ?? 0) ? current : deepest
    );
};

export const computePropFlow = (treeDiagram, componentProps = {}) => {
    const flowInfo = { nodes: {}, edges: {} };
    if (!treeDiagram?.hierarchy) return flowInfo;

    const { childrenMap, depthMap } = traverseHierarchy(treeDiagram.hierarchy);
    const parentMap = treeDiagram.parentMap || {};

    Object.keys(depthMap).forEach(nodeId => {
        flowInfo.nodes[nodeId] = { manual: [...(componentProps[nodeId] || [])], drilled: [], stateSource: [] };
    });

    const propToComponents = {};
    Object.entries(componentProps).forEach(([nodeId, props]) => {
        if (depthMap[nodeId] === undefined) return;
        props.forEach(prop => {
            propToComponents[prop] = propToComponents[prop] || [];
            if (!propToComponents[prop].includes(nodeId)) propToComponents[prop].push(nodeId);
        });
    });

    Object.entries(propToComponents).forEach(([propName, targetNodeIds]) => {
        if (targetNodeIds.length < 2) return;

        const lca = findLCA(targetNodeIds, parentMap, depthMap);
        if (!lca) return;

        const descendantsOfLca = collectConnected(lca, childrenMap);
        const pathNodes = new Set();

        targetNodeIds.forEach(t => {
            collectConnected(t, parentMap).forEach(node => {
                if (descendantsOfLca.has(node)) pathNodes.add(node);
            });
        });

        pathNodes.forEach(nodeId => {
            const node = flowInfo.nodes[nodeId] = flowInfo.nodes[nodeId] || { manual: [], drilled: [], stateSource: [] };

            if (nodeId === lca) {
                if (!node.stateSource.includes(propName)) node.stateSource.push(propName);
            } else if (!targetNodeIds.includes(nodeId)) {
                if (!node.drilled.includes(propName)) node.drilled.push(propName);
            }
        });

        Object.entries(parentMap).forEach(([childId, parentIds]) => {
            if (!pathNodes.has(childId)) return;
            parentIds.forEach(parentId => {
                if (!pathNodes.has(parentId)) return;

                const edgeId = `e-${parentId}-${childId}`;
                flowInfo.edges[edgeId] = flowInfo.edges[edgeId] || { drilled: [] };
                if (!flowInfo.edges[edgeId].drilled.includes(propName)) flowInfo.edges[edgeId].drilled.push(propName);
            });
        });
    });

    return flowInfo;
};
