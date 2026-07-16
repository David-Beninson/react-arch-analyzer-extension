const FILES_TO_KEEP_REGEX = /\.(jsx|tsx|js|ts)$/i;

export const transformToHierarchy = (jsonObj, allComponents = []) => {
    const componentMap = {};
    const parentLookupMap = {};
    const childrenTracking = new Map();
    const parentTracking = new Map();
    const hasParentSet = new Set();

    const getOrCreateNode = (path, initialData = {}) => {
        if (!componentMap[path]) {
            componentMap[path] = {
                id: path,
                name: initialData.name || path.split('/').pop(),
                children: [],
                contexts_defined: initialData.contexts_defined || [],
                contexts_provided: initialData.contexts_provided || [],
                contexts_consumed: initialData.contexts_consumed || [],
                hooks: initialData.hooks || [],
                state_variables: initialData.state_variables || [],
            };
            childrenTracking.set(path, new Set());
            parentTracking.set(path, new Set());
        };
        return componentMap[path];
    };

    // Pre-populate componentMap with all project components to handle isolated components
    allComponents.forEach(comp => {
        const isStr = typeof comp === 'string';
        const path = isStr ? comp : comp.file_path;
        if (FILES_TO_KEEP_REGEX.test(path)) {
            getOrCreateNode(path, isStr ? {} : comp);
        }
    });

    Object.entries(jsonObj).forEach(([parentPath, childrenPaths]) => {

        if (!FILES_TO_KEEP_REGEX.test(parentPath)) return;

        const parentNode = getOrCreateNode(parentPath);
        const parentChildSet = childrenTracking.get(parentPath);

        childrenPaths.forEach(childPath => {
            if (!FILES_TO_KEEP_REGEX.test(childPath)) return;
            const childNode = getOrCreateNode(childPath);
            const childParentSet = parentTracking.get(childPath);

            if (!parentChildSet.has(childPath)) {
                parentChildSet.add(childPath);
                parentNode.children.push(childNode);
            };

            if (!childParentSet.has(parentPath)) {
                childParentSet.add(parentPath);
                if (!parentLookupMap[childPath]) {
                    parentLookupMap[childPath] = [parentPath];
                } else {
                    parentLookupMap[childPath].push(parentPath);
                }
            };

            hasParentSet.add(childPath);

        });
    });
    const hierarchy = Object.values(componentMap).filter(node => !hasParentSet.has(node.id));

    return { hierarchy, parentMap: parentLookupMap };
};


export const getLayoutedElements = (nodes, edges) => {
    const H_SPACING = 250;
    const V_SPACING = 150;

    const childrenMap = {};
    const hasIncoming = new Set();

    nodes.forEach(n => { childrenMap[n.id] = []; });

    edges.forEach(({ source, target }) => {
        if (childrenMap[source]) {
            childrenMap[source].push(target);
        }
        hasIncoming.add(target);
    });

    const rootIds = nodes.filter(n => !hasIncoming.has(n.id)).map(n => n.id);

    if (!rootIds.length && nodes.length) {
        rootIds.push(nodes[0].id);
    }

    const nodeLevel = {};
    const primaryParent = {};
    const subtreeWidth = {};
    const visited = new Set();

    const buildTreeMetaData = (nodeId, level = 0) => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        nodeLevel[nodeId] = level;
        const children = childrenMap[nodeId] || [];
        let width = 0;

        for (let i = 0; i < children.length; i++) {
            const childId = children[i];
            if (!visited.has(childId)) {
                primaryParent[childId] = nodeId;
                width += buildTreeMetaData(childId, level + 1);
            };
        };

        subtreeWidth[nodeId] = Math.max(width, 1);
        return subtreeWidth[nodeId];
    };

    rootIds.forEach(id => buildTreeMetaData(id));

    const positions = {};
    const positionSubtree = (nodeId, xStart, xEnd) => {
        if (positions[nodeId]) return;

        const xCenter = (xStart + xEnd) / 2;
        positions[nodeId] = { x: xCenter, y: (nodeLevel[nodeId] ?? 0) * V_SPACING };

        const children = childrenMap[nodeId] || [];
        const primaryChildren = [];
        let totalChildWidth = 0;
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            if (primaryParent[c] === nodeId) {
                primaryChildren.push(c);
                totalChildWidth += (subtreeWidth[c] || 1);
            }
        }

        let currentX = xCenter - (totalChildWidth * H_SPACING) / 2;

        primaryChildren.forEach(childId => {
            const w = subtreeWidth[childId] || 1;
            positionSubtree(childId, currentX, currentX + w * H_SPACING);
            currentX += w * H_SPACING;
        });
    };
    let totalRootWidth = 0;
    rootIds.forEach(id => { totalRootWidth += (subtreeWidth[id] || 1); });
    let startX = -(totalRootWidth * H_SPACING) / 2;

    rootIds.forEach(id => {
        const w = subtreeWidth[id] || 1;
        positionSubtree(id, startX, startX + w * H_SPACING);
        startX += w * H_SPACING;
    });
    const layoutedNodes = nodes.map(node => ({
        ...node,
        position: positions[node.id] || { x: 0, y: (nodeLevel[node.id] || 0) * V_SPACING },
    }));

    return { nodes: layoutedNodes, edges };
};
