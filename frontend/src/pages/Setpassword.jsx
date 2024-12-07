import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Setpassword.css';
function Setpassword() {
    const [email, setEmail] = useState('');
    const [verificationcode, setVerificationKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = { email, verificationcode, newPassword };

        try {
            const response = await fetch("http://localhost:3000/passwordReset/newPassword", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setMessage('Passwort wurde erfolgreich zur�ckgesetzt!');
                navigate('/login');
            } else {
                setMessage('Fehler: ' + (await response.text()));
                navigate('/login');
            }
        } catch (error) {
            setMessage('Fehler: ' + error.message);
        }
    };

    return (
        <div className="setpassword_page">
            <div className="setpassword_container">
                <h1>Passwort zur�cksetzen</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">E-Mail:</label>
                    <input
                        className="setpassword_input"
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="verificationKey">Verifizierungsschl�ssel:</label>
                    <input
                        className="setpassword_input"
                        type="text"
                        id="verificationKey"
                        name="verificationKey"
                        value={verificationcode}
                        onChange={(e) => setVerificationKey(e.target.value)}
                        required
                    />
                    <label htmlFor="newPassword">Neues Passwort:</label>
                    <input
                        className="setpassword_input"
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <button className="setpassword_button" type="submit">Zur�cksetzen</button>
                </form>
                {message && <p className="setpassword_message">{message}</p>}
            </div>
        </div>
    );
}

export default Setpassword;
