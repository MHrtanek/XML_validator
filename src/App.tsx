import { useState } from 'react'
import viteLogo from '/vite.svg'
import reactLogo from './assets/react.svg'
import './App.css'
import { Routes, Route,Link } from 'react-router-dom';
import Validation from "./page/Validation.tsx";

function App() {
    const [count, setCount] = useState(0)

    return (

        <Routes>
            <Route path="/" element={
                <div>
                    <nav className="nav-container">
                        <ul className="nav-list">

                            <li>
                                <Link to="/validation" className="nav-link">
                                    Validator
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className={'Tittle'}>
                        <h1>This website is powered by:</h1>
                    </div>
                    <div>
                        <a href="https://vite.dev" target="_blank">
                            <img src={viteLogo} className="logo" alt="Vite logo" />
                        </a>
                        <a href="https://react.dev" target="_blank">
                            <img src={reactLogo} className="logo react" alt="React logo" />
                        </a>
                    </div>
                    <h1>Vite + React</h1>


                </div>
            } />

            <Route path="/validation" element={<Validation />} />
        </Routes>

    )
}

export default App