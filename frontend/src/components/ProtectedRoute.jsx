import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const backendUrl = "http://localhost:3000";

function ProtectedRoute({ children, shouldBeAuthenticated }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State to show loading while checking auth
  const [isAuthenticated, setIsAuthenticated] = useState(null); // State to store if user is authenticated

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/current-user`, {
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("currentUserName");

          setIsAuthenticated(false);
        } else {
          const data = await response.json();

          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication", error);
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentUserName");

        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuthStatus();
  }, [shouldBeAuthenticated]);

  if (isCheckingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated && shouldBeAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && !shouldBeAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
