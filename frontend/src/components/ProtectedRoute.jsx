/**
 * Diese Datei enthält die Route für Admin seite.
 * Sie schätzt bestimmte Routen und leitet Benutzer basierend auf ihrem Authentifizierungsstatus weiter.
 *
 * @autor Farah, Miray
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import prodconfig from "../production-config";

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
        const response = await fetch(`${prodconfig.backendUrl}/api/current-user`, {
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

  // Warte, bis die State-Updates abgeschlossen sind
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

  // Admin-Check nach Abschluss der State-Updates
  if (isAdminRoute && isAuthenticated && !isAdmin) {
    console.log("User is not admin, redirecting to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // Authentication checks
  if (!isAuthenticated && shouldBeAuthenticated) {
    console.log("User is not authenticated, redirecting to login.");
    return <Navigate to="/auth/login" replace />;
  }

  if (isAuthenticated && !shouldBeAuthenticated) {
    console.log("User is already authenticated, redirecting to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering protected children.");
  return children;
}

export default ProtectedRoute;
