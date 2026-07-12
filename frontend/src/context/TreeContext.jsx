import { useContext, createContext } from "react";
import { useState } from "react";

const TreeContext = createContext(null);

export function TreeProvider({ children }) {
    const [treeDiagram, setTreeDiagram] = useState(null);

    return (
        <TreeContext.Provider value={{ setTreeDiagram, treeDiagram }} >
            {children}
        </TreeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTreeDiagram() {

    const context = useContext(TreeContext);
    if (!context) {
        throw new Error("useTreeDiagram must be used within a TreeProvider");
    }
    return context;
}