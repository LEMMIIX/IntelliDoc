/**
 * @file Home.jsx - Startseite der Anwendung
 * @author Lennart (Logo), Ayoub
 * @description Diese Komponente stellt die Startseite der Anwendung dar und bietet Navigation zu Registrierung und Anmeldung.
 * 
 * @requires react-router-dom
 * @requires ../styles/home.css
 * @requires ../assets/intellimann.webp
 * @requires ../assets/intellidoc_logo.webp
 */

import { Link } from "react-router-dom";
import "../styles/home.css";
import intellimann from "../assets/intellimann.webp";
import intellidoc_logo from "../assets/intellidoc_logo.webp";

/**
 * @component Home
 * @description Hauptkomponente für die Startseite
 * @returns {JSX.Element} Die gerenderte Home-Komponente mit Navigation, Hero-Section, Features und Footer
 * 
 * @example
 * return (
 *   <Home />
 * )
 */
/**
 * @typedef {Object} PageSections
 * @property {JSX.Element} header - Enthält Navigation und Logo
 * @property {JSX.Element} heroSection - Hauptbereich mit Call-to-Action
 * @property {JSX.Element} featuresSection - Bereich für Produktmerkmale
 * @property {JSX.Element} footer - Fußbereich mit Kontaktinformationen
 */

/**
 * @typedef {Object} NavigationLinks
 * @property {string} signup - Link zur Registrierungsseite
 * @property {string} login - Link zur Anmeldeseite
 * @property {string} impressum - Link zum Impressum
 */

/**
 * Fehlerbehandlung für Bildladung
 * @function
 * @param {Event} e - Das Error-Event beim Bildladen
 * @description Behandelt Fehler beim Laden des Hero-Bildes
 */
function Home() {
    return (
        <div className="homepage">
            {/* Navigation */}
            <header className="homepage-header">
                <nav className="navbar">
                    <div className="logo-wrapper">
                        <div className="logo">
                            <img src={intellidoc_logo} alt="IntelliDoc Logo" />
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

            {/* Hero Section */}
            <main className="hero-section">
                <div className="hero-content">
                    <h1>Revolutioniere deine Dateiorganisation</h1>
                    <p>
                        Willkommen bei IntelliDoc, in nur 3 Klicks startest du in die Zukunft!
                    </p>
                    <p>
                        Verabschiede Chaos und begrüße Effizienz!
                    </p>
                    <div className="cta-buttons">
                        <Link to="/auth/signup" className="btn primary">Jetzt Starten</Link>
                        <Link to="/auth/login" className="btn secondary">Anmelden</Link>
                    </div>
                </div>
                <div className="hero-image">
                    <img 
                        src={intellimann} 
                        alt="IntelliDoc Hero Illustration"
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            console.error('Fehler beim Laden des Bildes');
                        }}
                    />
                </div>
            </main>

            {/* Features Section */}
            <section className="features-section">
                <div className="feature">
                    <div className="icon">🔧</div>
                    <h3>Entwickelt für Effizienz</h3>
                    <p></p>
                </div>
                <div className="feature">
                    <div className="icon">🔍</div>
                    <h3>Intelligente Suche</h3>
                    <p></p>
                </div>
                <div className="feature">
                    <div className="icon">🔒</div>
                    <h3>Sichere Datenverarbeitung</h3>
                    <p></p>
                </div>
            </section>
            <footer className="footer">
                <div className="footer-content">
                    <a href="mailto:dev.intellidoc@gmail.com" className="footer-link">Kontakt: dev.intellidoc@gmail.com</a>
                    <span className="divider">|</span>
                    <a href="/Impressum" className="footer-link">Impressum</a>
                </div>
            </footer>
        </div>
    );
}

export default Home;