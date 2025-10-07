import { Routes, Route, Link } from 'react-router-dom';
import Validation from "./page/Validation.tsx";
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/" element={
                    <div>
                        <nav className={'nav-container'}>
                            <ul className={'nav-list'}>
                                <li>
                                    <Link to="/validation" className="nav-link">
                                        Validator
                                    </Link>
                                </li>
                            </ul>
                            <div className="Title">
                                <h1>Validator</h1>
                            </div>
                        </nav>
                        <div className={'Tittle'}>
                            <h1>This website is powered by:</h1>
                        </div>
                    </div>
                } />
                <Route path="/validation" element={<Validation />} />
            </Routes>
        </ErrorBoundary>
    );
}

export default App;