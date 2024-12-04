import { Routes, Route, Navigate } from "react-router-dom"; // Added Navigate here
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
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

        {/* Legacy routes for backward compatibility */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      </Routes>
    </div>
  );
};

export default App;