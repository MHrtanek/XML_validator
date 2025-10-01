
import './Validation.css'
import {Link} from "react-router-dom";


function Validation() {
  return (
    <>
        <div className={"Title"}>
            <h1>Validator</h1>
        </div>
        <nav className="nav-container">
            <ul className="nav-list">
                <li>
                    <Link to="/" className="nav-link">
                        Homepage
                    </Link>
                </li>
                <li>
                    <Link to="/validation" className="nav-link">
                        Validator
                    </Link>
                </li>
            </ul>
        </nav>

    </>
  )
}

export default Validation
