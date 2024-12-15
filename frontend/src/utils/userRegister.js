import prodconfig from "../production-config";

export function userRegister(username,email,password,navigate) {

    fetch(`${prodconfig.backendUrl}/auth/register`, {
       method: 'POST',
       credentials:"include",
       headers: {
          'Content-Type': 'application/json',
         },
            body: JSON.stringify({ username, email, password }),
         })
        .then(response => { 
         console.log(response)
         response.json()})
        .then(data => {
            console.log(data)
            console.log('Success:', data);

            alert('Registration successful! Please Login');
            navigate('/login');

                        // window.location.href = '/dashboard';

        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        });
      
   }