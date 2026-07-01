import { useEffect, useState } from "react";
import { api } from "../utils/api";

interface ActivityLog {
  action: string;
  detail?: string;
  at: string;
}

interface Buyer {
  _id: string;
  username: string;
  buyerToken?: string;
  isActive: boolean;
  lastLoginAt?: string;
  licenseStatus: "active" | "expired";
  licenseExpiresAt?: string;
  activityLogs: ActivityLog[];
  createdAt: string;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [licenseDateDraft, setLicenseDateDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBuyers();
  }, []);

  async function loadBuyers() {
    setLoading(true);
    try {
      const res = await api.get("/buyers");
      setBuyers(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat buyer");
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

  async function handleToggleActive(id: string) {
    setActionId(id);
    try {
      await api.patch(`/buyers/${id}/toggle-active`);
      loadBuyers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengubah status buyer");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus buyer ini secara permanen?")) return;
    setActionId(id);
    try {
      await api.delete(`/buyers/${id}`);
      loadBuyers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menghapus buyer");
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleLicense(buyer: Buyer) {
    setActionId(buyer._id);
    try {
      await api.patch(`/buyers/${buyer._id}/license`, {
        licenseStatus: buyer.licenseStatus === "active" ? "expired" : "active"
      });
      loadBuyers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengubah lisensi");
    } finally {
      setActionId(null);
    }
  }

  async function handleSaveLicenseDate(id: string) {
    const date = licenseDateDraft[id];
    if (!date) return;
    setActionId(id);
    try {
      await api.patch(`/buyers/${id}/license`, { licenseExpiresAt: date });
      loadBuyers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan tanggal lisensi");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="dashboard">
      <h2>Manajemen Buyer</h2>
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Memuat...</p>
      ) : (
        <table className="post-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Buyer Token</th>
              <th>Status</th>
              <th>Lisensi</th>
              <th>Tgl Lisensi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((buyer) => (
              <>
                <tr key={buyer._id}>
                  <td>{buyer.username}</td>
                  <td><code>{buyer.buyerToken}</code></td>
                  <td>
                    <span className={`badge ${buyer.isActive ? "badge-posted" : "badge-failed"}`}>
                      {buyer.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <button disabled={actionId === buyer._id} onClick={() => handleToggleLicense(buyer)}>
                      <span className={`badge ${buyer.licenseStatus === "active" ? "badge-posted" : "badge-failed"}`}>
                        {buyer.licenseStatus === "active" ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </button>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={
                        licenseDateDraft[buyer._id] ??
                        (buyer.licenseExpiresAt ? buyer.licenseExpiresAt.slice(0, 10) : "")
                      }
                      onChange={(e) =>
                        setLicenseDateDraft({ ...licenseDateDraft, [buyer._id]: e.target.value })
                      }
                    />
                    <button disabled={actionId === buyer._id} onClick={() => handleSaveLicenseDate(buyer._id)}>
                      Simpan
                    </button>
                  </td>
                  <td className="actions">
                    <button disabled={actionId === buyer._id} onClick={() => handleRegenerate(buyer._id)}>
                      Regenerate Token
                    </button>
                    <button disabled={actionId === buyer._id} onClick={() => handleToggleActive(buyer._id)}>
                      {buyer.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button onClick={() => setExpandedId(expandedId === buyer._id ? null : buyer._id)}>
                      Riwayat
                    </button>
                    <button disabled={actionId === buyer._id} onClick={() => handleDelete(buyer._id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
                {expandedId === buyer._id && (
                  <tr>
                    <td colSpan={6}>
                      <div className="activity-log">
                        {buyer.activityLogs.length === 0 && <p>Belum ada riwayat aktivitas.</p>}
                        <ul>
                          {[...buyer.activityLogs].reverse().map((log, idx) => (
                            <li key={idx}>
                              <strong>{log.action}</strong> — {new Date(log.at).toLocaleString()}
                              {log.detail ? ` (${log.detail})` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {buyers.length === 0 && (
              <tr>
                <td colSpan={6}>Belum ada buyer terdaftar.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
