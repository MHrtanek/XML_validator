import { Routes, Route } from 'react-router-dom';
import Home from "./page/Home.tsx";
import Validation from "./page/Validation.tsx";
import Compare from "./page/Compare.tsx";
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/validation" element={<Validation />} />
                <Route path="/compare" element={<Compare />} />
            </Routes>
        </ErrorBoundary>
    );
}

export default App;