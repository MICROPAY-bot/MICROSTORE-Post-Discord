import { useEffect, useState } from "react";
import { api } from "../utils/api";

interface Buyer {
  _id: string;
  username: string;
  buyerToken?: string;
  isActive: boolean;
}

export default function IntegrationTokensPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadBuyers();
  }, []);

  async function loadBuyers() {
    setLoading(true);
    try {
      const res = await api.get("/buyers");
      setBuyers(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat token integrasi");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(id: string) {
    setActionId(id);
    try {
      await api.patch(`/buyers/${id}/regenerate-token`);
      loadBuyers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal regenerate token");
    } finally {
      setActionId(null);
    }
  }

  function copyToken(token?: string) {
    if (token) navigator.clipboard.writeText(token);
  }

  return (
    <div className="dashboard">
      <h2>Token Integrasi (Token User)</h2>
      <p className="subtitle">
        Setiap user/buyer memakai <strong>token miliknya sendiri</strong> (bukan API key bot bersama)
        untuk terhubung ke seluruh sistem Auto Post — dipasang sebagai header{" "}
        <code>x-buyer-token</code> saat memanggil <code>GET /api/integrations/ping</code> atau{" "}
        <code>POST /api/integrations/trigger-post</code>. Token ini terhubung otomatis ke seluruh
        modul: Auto Post, Manajemen Buyer, dan riwayat aktivitas.
      </p>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Memuat...</p>
      ) : (
        <table className="post-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Token User</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((buyer) => (
              <tr key={buyer._id}>
                <td>{buyer.username}</td>
                <td><code>{buyer.buyerToken}</code></td>
                <td>
                  <span className={`badge ${buyer.isActive ? "badge-posted" : "badge-failed"}`}>
                    {buyer.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => copyToken(buyer.buyerToken)}>Copy</button>
                  <button disabled={actionId === buyer._id} onClick={() => handleRegenerate(buyer._id)}>
                    Regenerate
                  </button>
                </td>
              </tr>
            ))}
            {buyers.length === 0 && (
              <tr>
                <td colSpan={4}>Belum ada user/buyer terdaftar.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
