document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        // Daten an Server senden
        fetch('/api/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            //console.log('Success:', data);
            //alert('Login successful!');
            // Nutzer an "dashboard.html" weiterleiten
            window.location.href = '../html/dashboard.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Login failed. Please try again.');
        });
    });
});
