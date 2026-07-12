export default function Footer() {
    return (
        <footer className="appFooter">
            <div className="appFooterContent">
                <small className="appFooterCopyright">
                    &#169; {new Date().getFullYear()} Architecture Analyzer Tool
                </small>
                <p className="appFooterText">
                    Built for educational architecture analysis.
                </p>
            </div>
        </footer>
    );
}