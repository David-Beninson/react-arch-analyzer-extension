import { useAuth } from '../../context/AuthContext';
import './NotAuthenticated.css';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) return children;

    return (
        <div className="not-auth">
            <div className="not-auth-card">
                <div className="not-auth-icon">🔐</div>
                <h1 className="not-auth-title">Authentication required</h1>
                <p className="not-auth-body">
                    This dashboard is accessed <strong>only through the VS Code extension</strong>.<br />
                    It cannot be opened directly in the browser.
                </p>

                <div className="not-auth-section">
                    <h2 className="not-auth-section-title">First time? Create an account:</h2>
                    <ol className="not-auth-steps">
                        <li>Open <strong>VS Code</strong></li>
                        <li>Press <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open the Command Palette</li>
                        <li>Type and run <code>React Arch: Register</code></li>
                        <li>Enter your email and password</li>
                    </ol>
                </div>

                <div className="not-auth-divider" />

                <div className="not-auth-section">
                    <h2 className="not-auth-section-title">Already have an account? Sign in:</h2>
                    <ol className="not-auth-steps">
                        <li>Press <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></li>
                        <li>Type and run <code>React Arch: Login</code></li>
                        <li>Enter your email and password</li>
                    </ol>
                </div>

                <div className="not-auth-divider" />

                <div className="not-auth-section">
                    <h2 className="not-auth-section-title">After logging in — open the graph:</h2>
                    <ol className="not-auth-steps">
                        <li>Click the <strong>React Architecture</strong> icon in the VS Code sidebar</li>
                        <li>Click a project from the history list</li>
                        <li>The graph will open here automatically</li>
                    </ol>
                </div>

                <div className="not-auth-tip">
                    💡 To sign out, run <code>React Arch: Logout</code> from the Command Palette.
                </div>
            </div>
        </div>
    );
}
