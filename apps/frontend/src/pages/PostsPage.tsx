import { useEffect, useState, FormEvent } from "react";
import { api } from "../utils/api";

interface PostLog {
  attemptedAt: string;
  status: "success" | "error";
  message: string;
}

interface PostItem {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  webhookUrl: string;
  scheduledAt: string;
  status: "draft" | "scheduled" | "posted" | "failed" | "cancelled";
  postedAt?: string;
  logs: PostLog[];
}

const emptyForm = {
  title: "",
  content: "",
  imageUrl: "",
  webhookUrl: "",
  scheduledAt: ""
};

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await api.get("/posts");
      setPosts(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat post");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/posts", form);
      setForm(emptyForm);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal membuat post");
    }
  }

  async function handlePostNow(id: string) {
    setActionId(id);
    try {
      await api.post(`/posts/${id}/post-now`);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal posting sekarang");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(id: string) {
    setActionId(id);
    try {
      await api.patch(`/posts/${id}/cancel`);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal membatalkan post");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus post ini secara permanen?")) return;
    setActionId(id);
    try {
      await api.delete(`/posts/${id}`);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menghapus post");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="dashboard">
      <h2>Kelola Auto Post</h2>

      <form className="post-form" onSubmit={handleCreate}>
        <input
          placeholder="Judul"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Isi konten"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <input
          placeholder="URL gambar (opsional)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <input
          placeholder="Discord Webhook URL"
          value={form.webhookUrl}
          onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          required
        />
        <button type="submit">Jadwalkan Post</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h3>Daftar Post</h3>
      {loading ? (
        <p>Memuat...</p>
      ) : (
        <table className="post-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jadwal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id}>
                <td>{post.title}</td>
                <td>{new Date(post.scheduledAt).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${post.status}`}>{post.status}</span>
                </td>
                <td className="actions">
                  {post.status !== "posted" && post.status !== "cancelled" && (
                    <>
                      <button disabled={actionId === post._id} onClick={() => handlePostNow(post._id)}>
                        Post Now
                      </button>
                      <button disabled={actionId === post._id} onClick={() => handleCancel(post._id)}>
                        Batal
                      </button>
                    </>
                  )}
                  <button disabled={actionId === post._id} onClick={() => handleDelete(post._id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4}>Belum ada post terjadwal.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
