import { createContext, useContext, useReducer } from "react";
import { propsReducer, initialPropsState } from "../utils/propsReducer";

const PropsStateContext = createContext(null);
const PropsDispatchContext = createContext(null);

export function PropsProvider({ children }) {
    const [state, dispatch] = useReducer(propsReducer, initialPropsState);

    return (
        < PropsStateContext.Provider value={state} >
            < PropsDispatchContext.Provider value={dispatch} >
                {children}
            </ PropsDispatchContext.Provider>
        </PropsStateContext.Provider >
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePropsState() {
    const context = useContext(PropsStateContext);
    if (!context) throw new Error("usePropsState must be used within a PropsProvider");
    return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePropsDispatch() {
    const context = useContext(PropsDispatchContext);
    if (!context) throw new Error("usePropsDispatch must be used within a PropsProvider");
    return context;
}
