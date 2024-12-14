import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import backendUrl from "../production-config";

function ProtectedRoute({
  children,
  shouldBeAuthenticated,
  isAdminRoute = false,
}) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("Checking authentication status...");
        const response = await fetch(`${backendUrl}/api/auth/current-user`, {
          credentials: "include",
        });

        if (!response.ok) {
          console.log("Authentication check failed.");
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("currentUserName");
          setIsAuthenticated(false);
        } else {
          const data = await response.json();
          console.log("API Response:", data);
          setIsAuthenticated(true);
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        console.error("Error during authentication check:", error);
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentUserName");
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [shouldBeAuthenticated]);

  useEffect(() => {
    console.log("State updated:", { isAuthenticated, isAdmin, isAdminRoute });
  }, [isAuthenticated, isAdmin, isAdminRoute]);

  if (isCheckingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Admin route check
  if (isAdminRoute && isAuthenticated && !isAdmin) {
    console.log("User is not admin, redirecting to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // Authentication checks
  if (!isAuthenticated && shouldBeAuthenticated) {
    console.log("User is not authenticated, redirecting to login.");
    return <Navigate to="/auth/login" replace />; // Updated path
  }

  if (isAuthenticated && !shouldBeAuthenticated) {
    console.log("User is already authenticated, redirecting to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering protected children.");
  return children;
}

export default ProtectedRoute;