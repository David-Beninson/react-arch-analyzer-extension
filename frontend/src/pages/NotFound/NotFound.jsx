import { Link } from 'react-router-dom';
import "./NotFound.css"
export default function NotFound() {
    return (
        <div className="container">
            <div className="content">
                <h1 className="errorCode">404</h1>
                <h2 className="title">Page Not Found</h2>
                <p className="text">
                    Oops! The page you are looking for doesn't exist, has been removed,
                    or is temporarily unavailable.
                </p>
                <Link to="/" className="homeBtn">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
