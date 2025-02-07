/**
 * @file App.jsx - Haupt-Routing-Komponente der Anwendung
 * @author Farah
 * @description Definiert die Haupt-Routing-Struktur der Anwendung, einschließlich geschützter Routen für das Dashboard 
 * und Admin-Bereich sowie Authentifizierungsrouten.
 * 
 * @requires react-router-dom
 * @requires ./pages/Login
 * @requires ./pages/Signup
 * @requires ./pages/Home
 * @requires ./pages/Verification
 * @requires ./pages/Requestpassword
 * @requires ./pages/Setpassword
 * @requires ./components/ui/Layout
 * @requires ./features/dashboard/FileUpload
 * @requires ./components/ProtectedRoute
 * @requires ./pages/Dashboard
 * @requires ./pages/admin/AdminDashboard
 * @requires ./features/dashboard/FolderPage
 * @requires ./pages/Impressum
 */

import { Routes, Route, Navigate } from "react-router-dom"; // Added Navigate here
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Verification from "./pages/Verification";
import Requestpassword from "./pages/Requestpassword";
import Setpassword from "./pages/Setpassword";

import Layout from "./components/ui/Layout";
import FileUpload from "./features/dashboard/FileUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FolderPage from "./features/dashboard/FolderPage";
import Impressum from "./pages/Impressum";

/**
 * Hauptkomponente der Anwendung, die das Routing verwaltet
 * @component
 * @returns {JSX.Element} Die gerenderte App-Komponente mit Routing-Struktur
 * 
 * @example
 * return (
 *   <BrowserRouter>
 *     <App />
 *   </BrowserRouter>
 * )
 */
/**
 * Routing-Gruppen der Anwendung
 * @namespace Routes
 * @property {Object} PublicRoutes - Öffentlich zugängliche Routen
 * @property {Object} AdminRoutes - Geschützte Admin-Routen
 * @property {Object} DashboardRoutes - Geschützte Dashboard-Routen
 * @property {Object} AuthRoutes - Authentifizierungs-Routen
 */
/**
 * Props für die ProtectedRoute-Komponente
 * @typedef {Object} ProtectedRouteProps
 * @property {boolean} shouldBeAuthenticated - Gibt an, ob der Benutzer authentifiziert sein muss
 * @property {boolean} [isAdminRoute] - Optional: Gibt an, ob es sich um eine Admin-Route handelt
 * @property {React.ReactNode} children - Die zu rendernden Kind-Komponenten
 */
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Impressum" element={<Impressum />} />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute shouldBeAuthenticated={true} isAdminRoute={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute shouldBeAuthenticated={true}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index path="/dashboard" element={<Dashboard />} />
          <Route index path="/folders/:folderId" element={<FolderPage />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/reset-password" element={<Setpassword />} />
          
        </Route>

        {/* Auth Routes */}
        <Route
          path="/auth/login"
          element={
            <ProtectedRoute shouldBeAuthenticated={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <ProtectedRoute shouldBeAuthenticated={false}>
              <Signup />
            </ProtectedRoute>
          }
              />
              <Route
                  path="/Verification"
                  element={
                      <ProtectedRoute shouldBeAuthenticated={false}>
                          <Verification />
                      </ProtectedRoute>
                  }
              />
              <Route
                    path="/Requestpassword"
                    element={
                        <ProtectedRoute shouldBeAuthenticated={false}>
                            <Requestpassword />
                        </ProtectedRoute>
                    }
              />
              <Route
                    path="/Setpassword"
                        element={
                            <ProtectedRoute shouldBeAuthenticated={false}>
                                <Setpassword />
                            </ProtectedRoute>
                        }  
                        />
          </Routes>
         
    </div>
  );
};

export default App;
