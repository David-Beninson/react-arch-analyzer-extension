import { useCallback } from "react";
import { usePropsState, usePropsDispatch } from "../context/PropsContext";

export function usePropsActions() {
    const dispatch = usePropsDispatch();

    const addProp = useCallback((nodeId, propName, color = null) => {
        dispatch({
            type: "ADD_PROP",
            payload: { nodeId, propName, color }
        });
    }, [dispatch]);

    const removeProp = useCallback((nodeId, propName) => {
        dispatch({
            type: "REMOVE_PROP",
            payload: { nodeId, propName }
        });
    }, [dispatch]);

    const editProp = useCallback((nodeId, oldPropName, newPropName) => {
        dispatch({
            type: "EDIT_PROP",
            payload: { nodeId, oldPropName, newPropName }
        });
    }, [dispatch]);

    const changePropColor = useCallback((propName, color) => {
        dispatch({
            type: "CHANGE_PROP_COLOR",
            payload: { propName, color }
        });
    }, [dispatch]);

    const resetProps = useCallback(() => {
        dispatch({ type: "RESET_PROPS" });
    }, [dispatch]);

    return {
        addProp,
        removeProp,
        editProp,
        changePropColor,
        resetProps
    };
}

export function usePropsData() {
    const state = usePropsState();

    return {
        componentProps: state.componentProps,
        propColors: state.propColors
    };
}
