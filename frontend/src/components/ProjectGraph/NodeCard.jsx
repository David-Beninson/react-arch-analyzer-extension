import { useState } from "react";
import { Handle, Position } from '@xyflow/react';
import { usePropsActions, usePropsData } from "../../hooks/usePropsActions";
import Input from "../ui/Input/Input";
import Button from "../ui/Button/Button";

export default function NodeCard({ id, data }) {
    const { propColors } = usePropsData();
    const { addProp: dispatchAdd, removeProp: dispatchRemove } = usePropsActions();
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [inputColor, setInputColor] = useState('#ede9fe');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const {
        sourceCount: srcCount = 0,
        targetCount: tgtCount = 0,
        manualProps = [],
        drilledProps = [],
        stateSourceProps = [],
        contexts_provided = [],
        contexts_consumed = []
    } = data;

    const displayManualProps = manualProps.filter(p => !stateSourceProps.includes(p) && !drilledProps.includes(p));
    const isStateSource = stateSourceProps.length > 0;

    const filteredSuggestions = Object.keys(propColors).filter(p =>
        p.toLowerCase().includes(inputValue.toLowerCase()) && p.toLowerCase() !== inputValue.toLowerCase()
    );

    const handleAddProp = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            dispatchAdd(id, trimmed, inputColor);
        }
        setInputValue('');
        setInputColor('#ede9fe');
        setShowSuggestions(false);
        setShowInput(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAddProp();
        if (e.key === 'Escape') { setShowInput(false); setInputValue(''); }
    };

    const targetHandles = Array.from({ length: tgtCount }).map((_, i) => {
        const pct = tgtCount === 1 ? 50 : 15 + (70 * i / (tgtCount - 1));
        return (
            <Handle
                key={`tgt-${i}`}
                id={`tgt-${i}`}
                type="target"
                position={Position.Top}
                className="nodeHandle"
                style={{ left: `${pct}%` }}
            />
        );
    });

    const searchClass = data.hasSearchActive ? (data.isHighlighted ? 'searched-highlight' : 'searched-dimmed') : '';

    return (
        <div className={`nodeCard ${isStateSource ? 'stateSource' : ''} ${searchClass}`.trim()}>
            {targetHandles}

            <div className="nodeHeader">
                <div className="nodeLabelWrapper">
                    <span className="nodeLabel">{data.label}</span>
                    {isStateSource && <span className="stateBadge">👑 State</span>}
                </div>
                <Button className="nodeBtn" onClick={() => setShowInput(!showInput)} text={showInput ? '✕' : '+'} />
            </div>

            {displayManualProps.length > 0 && (
                <div className="nodeProps">
                    {displayManualProps.map(prop => (
                        <span key={prop} className="nodePropTag manual" style={{ backgroundColor: propColors[prop] || '#eff6ff' }}>
                            {prop}
                            <Button className="nodePropRemove" onClick={() => dispatchRemove(id, prop)} text="×" />
                        </span>
                    ))}
                </div>
            )}

            {drilledProps.length > 0 && (
                <div className="nodeProps drilledSection">
                    {drilledProps.map(prop => (
                        <span key={prop} className="nodePropTag drilled" title="This prop is drilled from an ancestor" style={{ backgroundColor: propColors[prop] || '#fffbeb' }}>
                            🔗 {prop}
                        </span>
                    ))}
                </div>
            )}

            {stateSourceProps.length > 0 && (
                <div className="nodeProps stateSourceSection">
                    {stateSourceProps.map(prop => (
                        <span key={prop} className="nodePropTag stateSource" title="State for this prop should be defined here" style={{ backgroundColor: propColors[prop] || '#faf5ff' }}>
                            ✨ {prop}
                            <Button className="nodePropRemove" onClick={() => dispatchRemove(id, prop)} text="×" />
                        </span>
                    ))}
                </div>
            )}
            {contexts_provided.length > 0 && (
                <div className="nodeProps contextProvidedSection">
                    {contexts_provided.map(ctx => (
                        <span key={ctx} className="nodePropTag contextProvided" title="Provides this Context">
                            📥 {ctx}
                        </span>
                    ))}
                </div>
            )}

            {contexts_consumed.length > 0 && (
                <div className="nodeProps contextConsumedSection">
                    {contexts_consumed.map(ctx => (
                        <span key={ctx} className="nodePropTag contextConsumed" title="Consumes this Context">
                            🔌 {ctx}
                        </span>
                    ))}
                </div>
            )}

            {showInput && (
                <div className="nodeInputWrapper">
                    <Input
                        className="nodeInput"
                        type="text"
                        placeholder="prop name"
                        value={inputValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            setInputValue(val);
                            if (propColors[val]) setInputColor(propColors[val]);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="propsSuggestionsList nodrag" data-no-drag>
                            {filteredSuggestions.map(suggestion => (
                                <div
                                    key={suggestion}
                                    className="propsSuggestionItem"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setInputValue(suggestion);
                                        if (propColors[suggestion]) setInputColor(propColors[suggestion]);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                    <Input type="color" value={inputColor} onChange={(e) => setInputColor(e.target.value)} className="nodeColorPicker" title="Choose prop color" />
                    <Button className="nodeInputSubmitBtn" onClick={handleAddProp} type="button" text="✓" />
                </div>
            )}

            {srcCount > 0 && <Handle id="src-0" type="source" position={Position.Bottom} className="nodeHandle" />}
        </div>
    );
}
