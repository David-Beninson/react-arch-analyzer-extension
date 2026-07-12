import { useMemo } from 'react';
import { ReactFlow } from '@xyflow/react';
import { useSearchParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './ArchitectureGraph.css';
import NodeCard from './NodeCard';
import { prepareGraphData } from '../../utils/graphUtils';
import { usePropsData } from '../../hooks/usePropsActions';
import { computePropFlow } from '../../utils/dataFlowUtils';
import EdgeCustom from './EdgeCustom';

const nodeTypes = {
    custom: NodeCard,
};

const edgeTypes = {
    smoothstep: EdgeCustom,
};

export default function ArchitectureGraph({ treeDiagram }) {
    const { componentProps } = usePropsData();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search')?.trim().toLowerCase() || '';

    const { nodes, edges } = useMemo(() => {
        const flowInfo = computePropFlow(treeDiagram, componentProps);

        const graphData = prepareGraphData(treeDiagram, flowInfo);

        if (searchQuery) {
            graphData.nodes = graphData.nodes.map(node => {
                const label = node.data?.label || '';
                const isMatch = label.toLowerCase().includes(searchQuery);
                return {
                    ...node,
                    data: {
                        ...node.data,
                        isHighlighted: isMatch,
                        hasSearchActive: true,
                    }
                };
            });
        }

        return graphData;
    }, [treeDiagram, componentProps, searchQuery]);

    return (
        <div className="analysisGraphWrapper">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
}
