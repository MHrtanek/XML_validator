import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
    return (
        <div className="home-container">
            <div className="home-content">
                <h1 className="home-title">XML Tools</h1>
                
                <div className="home-buttons">
                    <Link to="/validation" className="home-button">
                        <h2>Validator</h2>
                        <p>Validate XML documents against XSD schemas</p>
                    </Link>

                    <Link to="/compare" className="home-button">
                        <h2>Compare</h2>
                        <p>Compare two XML documents side-by-side</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;

