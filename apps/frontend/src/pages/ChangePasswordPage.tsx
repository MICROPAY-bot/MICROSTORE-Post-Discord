import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      // Server mencabut refresh token setelah ganti password -> paksa login ulang
      logout();
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengganti password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <h2>Ganti Password</h2>
      <p className="subtitle">
        Login sebagai <strong>{user?.username}</strong>. Setelah berhasil, Anda akan logout otomatis
        dan perlu login ulang memakai password baru.
      </p>

      <form className="post-form" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        <label>Password Saat Ini</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <label>Password Baru</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
        />

        <label>Konfirmasi Password Baru</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Simpan Password Baru"}
        </button>
      </form>
    </div>
  );
}
