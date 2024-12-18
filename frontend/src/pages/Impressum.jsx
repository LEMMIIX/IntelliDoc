/**
 * Diese Datei enthält die Impressum-Komponente ohne Inhalte, nur mit Header und Footer.
 * 
 * @autor Lennart (Logo), Ayoub, Miray
 */

import { Link } from "react-router-dom";
import "../styles/impressum.css";
import intellidoc_logo from "../assets/intellidoc_logo.webp";

function Impressum() {
    return (
        <div className="impressum">
            {/* Navigation */}
            <header className="impressum-header">
                <nav className="navbar">
                    <div className="logo-wrapper">
                        <div className="logo">
                            <Link to="/">
                                <img src={intellidoc_logo} alt="IntelliDoc Logo" />
                            </Link>
                        </div>
                    </div>
                    <div className="nav-links-buttons">
                        <ul className="nav-links">
                            <li><Link to="/" className="nav-item"></Link></li>
                            <li><Link to="#" className="nav-item"></Link></li>
                        </ul>
                        <div className="nav-buttons">
                            <Link to="/auth/signup" className="btn nav-btn">Registrieren</Link>
                            <Link to="/auth/login" className="btn nav-btn2">Anmelden</Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <div className="impressum-content">
                <div className="impressum-section">
                    <h2>Das Team</h2>
                    
                    <div className="team-category">
                        <div className="team-category-title">Gesamtes Team</div>
                        <div className="team-list">
                            <div className="team-member">Belbaraka, Ayoub</div>
                            <div className="team-member">Bouassria, Farah</div>
                            <div className="team-member">Dablaq, Ilyass</div>
                            <div className="team-member">Kilic, Miray-Eren</div>
                            <div className="team-member">Moeller, Lennart</div>
                            <div className="team-member">Neumann, Luca</div>
                        </div>
                    </div>

                    <div className="team-category">
                        <div className="team-category-title">Frontend</div>
                        <div className="team-list">
                            <div className="team-member">Belbaraka, Ayoub</div>
                            <div className="team-member">Bouassria, Farah</div>
                            <div className="team-member">Dablaq, Ilyass</div>
                            <div className="team-member">Kilic, Miray-Eren</div>
                        </div>
                    </div>

                    <div className="team-category">
                        <div className="team-category-title">Backend</div>
                        <div className="team-list">
                            <div className="team-member">Belbaraka, Ayoub</div>
                            <div className="team-member">Dablaq, Ilyass</div>
                            <div className="team-member">Kilic, Miray-Eren</div>
                            <div className="team-member">Moeller, Lennart</div>
                            <div className="team-member">Neumann, Luca</div>
                        </div>
                    </div>

                    <div className="team-category">
                        <div className="team-category-title">Teamkoordinator</div>
                        <div className="team-list">
                            <div className="team-member">Neumann, Luca</div>
                        </div>
                    </div>

                    <div className="team-category">
                        <div className="team-category-title">Systemkoordinator</div>
                        <div className="team-list">
                            <div className="team-member">Moeller, Lennart</div>
                        </div>
                    </div>

                    <div className="team-category">
                        <div className="team-category-title">Projektleitung</div>
                        <div className="team-list">
                            <div className="team-member">Ahlf, Henning</div>
                            <div className="team-member">Dunkel, Kolja</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <a href="mailto:dev.intellidoc@gmail.com" className="footer-link">Kontakt: dev.intellidoc@gmail.com</a>
                    <span className="divider">|</span>
                    <span className="footer-link">Impressum</span>
                </div>
            </footer>
        </div>
    );
}

export default Impressum;