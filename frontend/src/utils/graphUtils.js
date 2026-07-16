import { getLayoutedElements } from './treeHelpers';
import { MarkerType } from '@xyflow/react';

const EDGE_COLORS = [
    '#6366f1',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#f97316',
    '#64748b',
];

export const prepareGraphData = (treeDiagram, drillingInfo = null) => {
    if (!treeDiagram || !Array.isArray(treeDiagram.hierarchy)) {
        return { nodes: [], edges: [] };
    }

    const nodesArr = [];
    const edgesArr = [];
    const visitedNodes = new Set();
    const visitedEdges = new Set();

    const sourceColorMap = {};
    let colorIndex = 0;

    function getColorForSource(sourceId) {
        if (!sourceColorMap[sourceId]) {
            sourceColorMap[sourceId] = EDGE_COLORS[colorIndex % EDGE_COLORS.length];
            colorIndex++;
        }
        return sourceColorMap[sourceId];
    }

    function processComponent(component, parentId = null) {
        if (!component) return;
        const currentId = component.id;

        if (parentId && currentId) {
            const edgeId = `e-${parentId}-${currentId}`;
            if (!visitedEdges.has(edgeId)) {
                visitedEdges.add(edgeId);
                const color = getColorForSource(parentId);
                const edgeDrill = drillingInfo?.edges?.[edgeId] || { drilled: [] };

                edgesArr.push({
                    id: edgeId,
                    source: parentId,
                    target: currentId,
                    type: 'smoothstep',
                    style: { stroke: color, strokeWidth: 1.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 14,
                        height: 14,
                        color: color,
                    },
                    data: {
                        drilledProps: edgeDrill.drilled
                    }
                });
            }
        }

        if (currentId && !visitedNodes.has(currentId)) {
            const nodeDrill = drillingInfo?.nodes?.[currentId] || { manual: [], drilled: [], stateSource: [] };

            nodesArr.push({
                id: currentId,
                position: { x: 0, y: 0 },
                data: {
                    label: component.name,
                    manualProps: nodeDrill.manual,
                    drilledProps: nodeDrill.drilled,
                    stateSourceProps: nodeDrill.stateSource,
                    contexts_defined: component.contexts_defined || [],
                    contexts_provided: component.contexts_provided || [],
                    contexts_consumed: component.contexts_consumed || [],
                    hooks: component.hooks || [],
                    state_variables: component.state_variables || [],
                },
                type: 'custom',
            });
            visitedNodes.add(currentId);
        }

        if (component.children && Array.isArray(component.children)) {
            component.children.forEach((child) => {
                processComponent(child, currentId);
            });
        }
    }

    treeDiagram.hierarchy.forEach((root) => processComponent(root));

    const tgtCounter = {};
    const srcTotal = {};
    const tgtTotal = {};

    edgesArr.forEach(e => {
        srcTotal[e.source] = (srcTotal[e.source] || 0) + 1;
        tgtTotal[e.target] = (tgtTotal[e.target] || 0) + 1;
    });

    edgesArr.forEach(e => {
        const ti = tgtCounter[e.target] || 0;
        e.targetHandle = `tgt-${ti}`;
        tgtCounter[e.target] = ti + 1;
    });

    nodesArr.forEach(n => {
        n.data.sourceCount = srcTotal[n.id] || 0;
        n.data.targetCount = tgtTotal[n.id] || 0;
    });

    const laid = getLayoutedElements(nodesArr, edgesArr);

    const posMap = {};
    laid.nodes.forEach(n => { posMap[n.id] = n.position; });

    laid.edges = laid.edges.map(e => {
        const sp = posMap[e.source];
        const tp = posMap[e.target];
        if (sp && tp && sp.y >= tp.y) {
            return {
                ...e,
                style: { ...e.style, strokeDasharray: '6,4', opacity: 0.35 },
                markerEnd: { ...e.markerEnd, color: '#bbb' },
            };
        }
        return e;
    });

    return laid;
};