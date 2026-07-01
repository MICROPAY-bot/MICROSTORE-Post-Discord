import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    }
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <p>Selamat datang, <strong>{user?.username}</strong> (role: {user?.role})</p>
      <nav className="admin-nav">
        <Link to="/admin/posts">Kelola Auto Post</Link>
        <Link to="/admin/buyers">Manajemen Buyer</Link>
        <Link to="/admin/tokens">Token Integrasi (Token User)</Link>
      </nav>
    </div>
  );
}
