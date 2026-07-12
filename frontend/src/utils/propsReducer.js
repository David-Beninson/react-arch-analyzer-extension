const COLOR_PALETTE = [
    '#ede9fe', '#eff6ff', '#ecfdf5', '#fff7ed',
    '#fdf2f8', '#f0fdf4', '#fff1f2', '#f0f9ff'
];

export const initialPropsState = {
    componentProps: {},
    propColors: {},
};

export function propsReducer(state, action) {
    switch (action.type) {
        case "ADD_PROP": {
            const { nodeId, propName, color } = action.payload;
            const currentProps = state.componentProps[nodeId] || [];
            if (currentProps.includes(propName)) return state;

            const updatedColors = { ...state.propColors };
            if (color) {
                updatedColors[propName] = color;
            } else if (!updatedColors[propName]) {
                const usedCount = Object.keys(updatedColors).length;
                updatedColors[propName] = COLOR_PALETTE[usedCount % COLOR_PALETTE.length];
            }

            return {
                ...state,
                componentProps: { ...state.componentProps, [nodeId]: [...currentProps, propName] },
                propColors: updatedColors,
            };
        }
        case "REMOVE_PROP": {
            const { nodeId, propName } = action.payload;
            const currentProps = state.componentProps[nodeId] || [];
            return {
                ...state,
                componentProps: { ...state.componentProps, [nodeId]: currentProps.filter(p => p !== propName) },
            };
        }
        case "EDIT_PROP": {
            const { nodeId, oldPropName, newPropName } = action.payload;
            const currentProps = state.componentProps[nodeId] || [];
            if (!currentProps.includes(oldPropName) || currentProps.includes(newPropName)) return state;

            const updatedColors = { ...state.propColors };
            if (updatedColors[oldPropName]) {
                updatedColors[newPropName] = updatedColors[oldPropName];

                const isStillUsed = Object.entries(state.componentProps).some(([id, props]) =>
                    id !== nodeId && props.includes(oldPropName)
                );

                if (!isStillUsed) {
                    delete updatedColors[oldPropName];
                }
            }

            return {
                ...state,
                componentProps: { ...state.componentProps, [nodeId]: currentProps.map(p => p === oldPropName ? newPropName : p) },
                propColors: updatedColors,
            };
        }
        case "CHANGE_PROP_COLOR": {
            const { propName, color } = action.payload;
            return {
                ...state,
                propColors: { ...state.propColors, [propName]: color },
            };
        }
        case "RESET_PROPS":
            return initialPropsState;
        default:
            return state;
    }
}
