import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import PostsPage from "./pages/PostsPage";
import BuyersPage from "./pages/BuyersPage";
import IntegrationTokensPage from "./pages/IntegrationTokensPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/posts"
            element={
              <ProtectedRoute role="admin">
                <PostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buyers"
            element={
              <ProtectedRoute role="admin">
                <BuyersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tokens"
            element={
              <ProtectedRoute role="admin">
                <IntegrationTokensPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
