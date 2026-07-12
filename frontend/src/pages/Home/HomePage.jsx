import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button/Button';
import './HomePage.css';

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="homePage">
            <h1 className="homePageTitle">Architecture Analyzer</h1>
            <p className="homePageDescription">
                Analyze your component hierarchy and detect Prop Drilling issues automatically.
            </p>

            <section className="instructions">
                <h2 className="instructionsTitle">How to Analyze Your Project</h2>
                <p className="instructionsSubtitle">Choose one of the two quick methods to generate your architecture file:</p>

                <div className="optionsWrapper">
                    <div className="optionCard">
                        <h3 className="optionTitle">Method 1: Install Locally (Recommended)</h3>
                        <ol className="optionList">
                            <li>Install the analyzer in your project:
                                <pre><code>npm install -D madge</code></pre>
                            </li>
                            <li>Generate the architecture map file (supports JSX and TSX):
                                <pre><code>npx madge --extensions jsx,tsx --json src/ &gt; architecture.json</code></pre>
                            </li>
                        </ol>
                    </div>

                    <div className="optionCard">
                        <h3 className="optionTitle">Method 2: Run Directly (One-Liner)</h3>
                        <ol className="optionList">
                            <li>Run the analyzer directly with the auto-approve flag:
                                <pre><code>npx -y madge --extensions jsx,tsx --json src/ &gt; architecture.json</code></pre>
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="finalStep">
                    <p><strong>Next Step:</strong> Locate the generated <code>architecture.json</code> file in your root folder and upload it in the next section.</p>
                </div>
            </section>

            <section className="nextSteps">
                <p>Once uploaded, we will visualize your data flow and provide state management recommendations.</p>
            </section>

            <Button text="Try this out" onClick={() => navigate('/newproject')} />
        </div>
    );
}
