function getCurrentUserId() {
    return fetch('/api/current-user')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get current user');
            }
            return response.json();
        })
        .then(data => data.userId)
        .catch(error => {
            console.error('Error getting current user:', error);
            return null;
        });
}