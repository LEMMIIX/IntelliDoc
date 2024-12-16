import { Link } from "react-router-dom";
import "../styles/home.css";
function Home() {
    return (
        <div className="homepage">
            {/* Navigation */}
            <header className="homepage-header">
                <nav className="navbar">
                    <div className="logo-wrapper">
                        <div className="logo">IntelliDoc</div>
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
                    <h1>Manage your documents better</h1>
                    <p>
                        Welcome to IntelliDoc, nur in 3 Klicks können Sie alles finden, was Sie brauchen.

                        Verabschieden Sie sich von Chaos und begrüßen Sie Effizienz!
                    </p>
                    <div className="cta-buttons">
                        <Link to="/auth/signup" className="btn primary">Jetzt Starten</Link>
                        <Link to="/auth/login" className="btn secondary">Anmelden</Link>
                    </div>
                </div>
                <div className="hero-image">
                    <img src="/src/assets/image1.png" alt="Hero Illustration" />
                </div>
            </main>

            {/* Features Section */}
            <section className="features-section">
                <div className="feature">
                    <div className="icon">🔧</div>
                    <h3>Entwickelt für Effizienz</h3>
                    <p>Components, tools, and templates tailored for developers.</p>
                </div>
                <div className="feature">
                    <div className="icon">🔍</div>
                    <h3>Intelligente Suche     </h3>
                    <p>Smart und präzise</p>
                </div>
                <div className="feature">
                    <div className="icon">🔒</div>
                    <h3>Sichere Datenverarbeitung           </h3>
                    <p>Your data is safe with IntelliDoc.</p>
                </div>
            </section>
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

export default Home;
