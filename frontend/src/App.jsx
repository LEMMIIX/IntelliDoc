// import "./styles/App.css";
import { Routes, Route } from "react-router-dom";
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

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin Route separat */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute shouldBeAuthenticated={true} isAdminRoute={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/login"
          element={
            <ProtectedRoute shouldBeAuthenticated={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
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
