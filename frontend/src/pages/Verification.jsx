import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../styles/verification.css";

function Verification() {
    const location = useLocation(); // Verwendet die location-API von react-router-dom
    const email = location.state?.email || ""; 
    const [verificationCode, setVerificationCode] = useState("");
    const navigate = useNavigate();

    const handleVerification = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/verify-code", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email, // E-Mail dynamisch verwenden
                    verificationCode,
                }),
            });
            if (response.status === 200) {
                // Verifizierung erfolgreich
                alert("Verifizierung erfolgreich!");
                navigate("/auth/login");
            } else if (response.status === 400) {
                // Wenn es einen Fehler bei der Verifizierung gab
                const data = await response.json();
                alert(data.message || "Ung�ltiger Verifizierungscode.");
            } else {
                // Fehlerhafte HTTP-Antwort
                alert("Fehler bei der Verifizierung. Bitte versuchen Sie es erneut.");
            }
        } catch (error) {
            console.error("Fehler:", error);
            alert("Ein unerwarteter Fehler ist aufgetreten.");
        }
    };

    return (
        <main className="verification_page">
            <div className="verification_container">
                <h1>Verifizierung erforderlich</h1>
                <p>Bitte überprüfen Sie Ihre E-Mail-Adresse und geben Sie den Verifizierungscode ein.</p>
                <div>
                    <input
                        type="email"
                        placeholder="E-Mail-Adresse"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="verification_input"
                    />
                    <input
                        type="text"
                        placeholder="Verifizierungscode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="verification_input"
                    />
                    <button onClick={handleVerification} className="verification_button">
                        Bestätigen
                    </button>
                </div>

            </div>
        </main>
    );
}

export default Verification;

