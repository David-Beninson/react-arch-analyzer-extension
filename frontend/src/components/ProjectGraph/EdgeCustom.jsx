import { getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

export default function EdgeCustom({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const drilledProps = data?.drilledProps || [];
    const isDrilled = drilledProps.length > 0;

    return (
        <>
            <path
                id={id}
                className="react-flow__edge-path custom-edge-path"
                d={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: isDrilled ? '#ef4444' : style.stroke,
                    strokeWidth: isDrilled ? 3 : 1.5,
                }}
            />

            {isDrilled && (
                <path
                    d={edgePath}
                    fill="none"
                    className="edge-drilling-animation"
                    stroke="#fca5a5"
                    strokeWidth={3}
                    strokeDasharray="6,12"
                />
            )}

            {isDrilled && (
                <EdgeLabelRenderer>
                    <div
                        className="edge-drilled-badge nodrag"
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        }}
                        title={`Drilled props: ${drilledProps.join(', ')}`}
                    >
                        ⚠️ {drilledProps.length > 1 ? `${drilledProps.length} Props` : drilledProps[0]}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
