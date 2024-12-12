import { useState } from "react"; // Importing useState hook to manage component state
import { userLogin } from "../utils/userLogin"; // Importing the userLogin function from utils
import { Link, useNavigate } from "react-router-dom"; // Importing Link for navigation and useNavigate for programmatic navigation
import "../styles/index.css"; // Importing CSS styles for the component

function Login() {
  const navigate = useNavigate(); // Initializing navigate function to redirect users
  const [email, setEmail] = useState(""); // State to manage the username input
  const [password, setPassword] = useState(""); // State to manage the password input

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Preventing the default form submission behavior

    // Calling the userLogin function to log in the user
    userLogin(email, password, navigate);
  };

  return (
    <main className="login_page">
      {/* Main container for the login page */}
      <div className="login_container">
        <img src="../../../public/intelliDoc.jpeg" className="logo" />

        {/* Logo image */}
        <Link to="/" className="login_homepage_link">
          <img src="../../../public/homepage.png" className="homepage_icon" />{" "}
        </Link>
        <form className="login_form" onSubmit={handleSubmit}>
          <div className="login_input_container">
            <label htmlFor="email" className="login_input_label">
              email:
            </label>
            <input
              type="email" // Input type for username
              name="email" // Name attribute for the input
              className="login_input" // CSS class for styling
              value={email} // Binding the input value to state
              onChange={(e) => setEmail(e.target.value)} // Updating state on input change
              required // Marking this field as required
            />
          </div>
          <div className="login_input_container">
            <label htmlFor="password" className="login_input_label">
              Passwort:
            </label>
            <input
              type="password" // Input type for password
              name="password" // Name attribute for the input
              className="login_input" // CSS class for styling
              value={password} // Binding the input value to state
              onChange={(e) => setPassword(e.target.value)} // Updating state on input change
              required // Marking this field as required
            />
          </div>
          <button type="submit" className="button">
            Login
          </button>
          <div className="login_signup_question">
            <p>Do you not have an account?</p>{" "}
            <Link to="/signup" className="text-blue-500">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Login; // Exporting the Login component for use in other parts of the application
