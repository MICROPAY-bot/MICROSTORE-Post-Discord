import { useEffect, useRef, useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

interface ChannelRow {
  channelId: string;
  delayMinutes: number;
}

interface ConfigLog {
  at: string;
  level: "info" | "success" | "error";
  message: string;
}

interface ConfigData {
  sendMode: "embed" | "biasa";
  messageContent: string;
  channels: ChannelRow[];
  status: "running" | "stopped";
  discordTokenMasked: string;
  hasToken: boolean;
  licenseStatus: "active" | "expired";
  licenseExpiresAt: string | null;
  logs: ConfigLog[];
}

const DISCORD_SERVER_URL = "https://discord.gg/pJ57Zcscpe";

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState<ConfigData | null>(null);
  const [discordToken, setDiscordToken] = useState("");
  const [sendMode, setSendMode] = useState<"embed" | "biasa">("embed");
  const [messageContent, setMessageContent] = useState("");
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [logs, setLogs] = useState<ConfigLog[]>([]);
  const [status, setStatus] = useState<"running" | "stopped">("stopped");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadConfig();
    pollRef.current = setInterval(pollLogs, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadConfig() {
    try {
      const res = await api.get("/buyer-config/me");
      const data: ConfigData = res.data.data;
      setConfig(data);
      setSendMode(data.sendMode);
      setMessageContent(data.messageContent);
      setChannels(data.channels.length > 0 ? data.channels : [{ channelId: "", delayMinutes: 30 }]);
      setStatus(data.status);
      setLogs(data.logs);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat konfigurasi");
    }
  }

  async function pollLogs() {
    try {
      const res = await api.get("/buyer-config/me/logs");
      setStatus(res.data.data.status);
      setLogs(res.data.data.logs);
    } catch {
      // diam-diam abaikan kegagalan polling supaya tidak mengganggu UI
    }
  }

  function addChannelRow() {
    if (channels.length >= 10) return;
    setChannels([...channels, { channelId: "", delayMinutes: 30 }]);
  }

  function removeChannelRow(index: number) {
    setChannels(channels.filter((_, i) => i !== index));
  }

  function updateChannel(index: number, field: keyof ChannelRow, value: string) {
    const next = [...channels];
    if (field === "delayMinutes") {
      next[index].delayMinutes = Number(value) || 1;
    } else {
      next[index].channelId = value;
    }
    setChannels(next);
  }

  async function handleSaveConfig(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        sendMode,
        messageContent,
        channels: channels.filter((c) => c.channelId.trim() !== "")
      };
      if (discordToken.trim() !== "") {
        payload.discordToken = discordToken.trim();
      }

      await api.put("/buyer-config/me", payload);
      setInfo("Konfigurasi berhasil disimpan");
      setDiscordToken("");
      loadConfig();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan konfigurasi");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await api.post("/buyer-config/me/start");
      setStatus("running");
      pollLogs();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menjalankan auto post");
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await api.post("/buyer-config/me/stop");
      setStatus("stopped");
      pollLogs();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menghentikan auto post");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    api.post("/auth/logout").catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard buyer-panel">
      {/* 1. NAMA STORE */}
      <h1 className="store-name">MICROSTORE</h1>

      {error && <p className="error">{error}</p>}
      {info && <p className="info-msg">{info}</p>}

      {/* 2. STATUS / LISENSI / JUMLAH CHANNEL / LISENSI DATE */}
      <div className="status-grid">
        <div className="status-card">
          <span className="status-label">Status</span>
          <span className={`badge ${status === "running" ? "badge-posted" : "badge-failed"}`}>
            {status === "running" ? "RUNNING" : "STOP"}
          </span>
        </div>
        <div className="status-card">
          <span className="status-label">Lisensi</span>
          <span className={`badge ${config?.licenseStatus === "active" ? "badge-posted" : "badge-failed"}`}>
            {config?.licenseStatus === "active" ? "ACTIVE" : "EXPIRED"}
          </span>
        </div>
        <div className="status-card">
          <span className="status-label">Jumlah Channel</span>
          <span className="status-value">{channels.filter((c) => c.channelId.trim() !== "").length} / 10</span>
        </div>
        <div className="status-card">
          <span className="status-label">Lisensi Date</span>
          <span className="status-value">
            {config?.licenseExpiresAt ? new Date(config.licenseExpiresAt).toLocaleDateString() : "-"}
          </span>
        </div>
      </div>

      {/* 3. KONFIGURASI PESAN */}
      <form className="post-form config-form" onSubmit={handleSaveConfig}>
        <h3>Konfigurasi Pesan</h3>

        <label>Discord Token Buyer</label>
        <input
          type="password"
          placeholder={
            config?.hasToken
              ? `Tersimpan: ${config.discordTokenMasked} (isi untuk mengganti)`
              : "Masukkan Discord Token Anda"
          }
          value={discordToken}
          onChange={(e) => setDiscordToken(e.target.value)}
        />

        <label>Mode Kirim</label>
        <select value={sendMode} onChange={(e) => setSendMode(e.target.value as "embed" | "biasa")}>
          <option value="embed">EMBED</option>
          <option value="biasa">BIASA</option>
        </select>

        <label>Isi Pesan</label>
        <textarea
          placeholder="Isi pesan yang akan dikirim ke setiap channel"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
        />

        <label>Daftar Channel (maks. 10)</label>
        <table className="channel-table">
          <thead>
            <tr>
              <th>Channel ID</th>
              <th>Delay (menit)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    placeholder="Channel ID"
                    value={ch.channelId}
                    onChange={(e) => updateChannel(idx, "channelId", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={ch.delayMinutes}
                    onChange={(e) => updateChannel(idx, "delayMinutes", e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => removeChannelRow(idx)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addChannelRow} disabled={channels.length >= 10}>
          + Tambah Channel
        </button>

        {/* 5. TOMBOL RUNNING / STOP / SAVE */}
        <div className="action-buttons">
          <button type="button" className="btn-running" disabled={busy} onClick={handleStart}>
            RUNNING
          </button>
          <button type="button" className="btn-stop" disabled={busy} onClick={handleStop}>
            STOP
          </button>
          <button type="submit" className="btn-save" disabled={busy}>
            SAVE KONFIGURASI
          </button>
        </div>
      </form>

      {/* 4. LIVE LOG AUTO */}
      <h3>Live Log Auto</h3>
      <div className="live-log-box">
        {logs.length === 0 && <p className="log-empty">Belum ada aktivitas.</p>}
        {logs.map((log, idx) => (
          <div key={idx} className={`log-line log-${log.level}`}>
            <span className="log-time">{new Date(log.at).toLocaleTimeString()}</span> {log.message}
          </div>
        ))}
      </div>

      {/* 6. TOMBOL KE SERVER DISCORD MICROSTORE */}
      <a className="discord-server-btn" href={DISCORD_SERVER_URL} target="_blank" rel="noreferrer">
        Buka Server Discord MICROSTORE
      </a>

      {/* 7. INFO AKUN BUYER + LOGOUT */}
      <div className="account-box">
        <span>Login sebagai: <strong>{user?.username}</strong></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
