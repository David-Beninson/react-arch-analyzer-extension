import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'auth_token';

/**
 * Read a one-time token injected by the VS Code extension via URL query param.
 * After reading, the param is removed from the URL so it is not exposed in history.
 */
function consumeVsToken() {
    const params = new URLSearchParams(window.location.search);
    const vsToken = params.get('vstoken');
    if (!vsToken) return null;

    // Remove the param from the browser URL without triggering a reload
    params.delete('vstoken');
    const cleanSearch = params.toString();
    const newUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);

    return vsToken;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        // Priority: VS Code injected token → previously stored token
        const vsToken = consumeVsToken();
        if (vsToken) {
            localStorage.setItem(TOKEN_KEY, vsToken);
            return vsToken;
        }
        return localStorage.getItem(TOKEN_KEY);
    });

    // Keep axios interceptor in sync whenever token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }, [token]);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }, []);

    const value = useMemo(
        () => ({ token, isAuthenticated: !!token, logout }),
        [token, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
