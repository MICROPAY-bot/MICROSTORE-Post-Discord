# MICROSTORE AUTO POST

## v1.7.0 — Panel Buyer Self-Service: Discord Token Diisi Sendiri + Auto Poster Engine

Added:
- Model baru `BuyerConfig` — menyimpan konfigurasi auto-post milik masing-masing buyer: Discord Token (diisi sendiri oleh buyer, bukan token sistem), mode kirim (Embed/Biasa), isi pesan, daftar channel (maks. 10, masing-masing punya delay dalam menit).
- Endpoint `/api/buyer-config/me` (GET/PUT), `/me/start`, `/me/stop`, `/me/logs` — semua khusus role buyer, hanya bisa mengakses/mengubah konfigurasi miliknya sendiri.
- **Engine pengirim pesan ke Discord** (`discordBotSender.ts`) yang memakai token Discord milik buyer sendiri untuk mengirim pesan langsung ke channel ID yang dikonfigurasi.
- **Scheduler per-buyer** (`buyerAutoPosterScheduler.ts`) — jalan tiap menit, menghormati delay per-channel (dalam menit) secara independen, hanya memproses buyer dengan status `running`.
- Field lisensi baru di `User`: `licenseStatus` (active/expired) dan `licenseExpiresAt`, beserta endpoint admin `PATCH /api/buyers/:id/license` untuk mengelolanya.
- **Panel Buyer Dashboard dirombak total**, urutan sesuai permintaan:
  1. Nama Store "MICROSTORE"
  2. Status grid: Status (Running/Stop), Lisensi (Active/Expired), Jumlah Channel, Lisensi Date
  3. Konfigurasi Pesan: Discord Token Buyer (input sendiri oleh buyer), Mode Kirim (Embed/Biasa), Isi Pesan, Daftar Channel (2 kolom: Channel ID & Delay menit, maks 10)
  4. Live Log Auto (auto-refresh polling tiap 5 detik)
  5. Tombol RUNNING, STOP, SAVE KONFIGURASI
  6. Tombol ke Server Discord MICROSTORE
  7. Info akun buyer + Logout
- Halaman admin Manajemen Buyer ditambah kontrol lisensi (toggle Active/Expired + set tanggal).
- Token Discord disimpan dengan `select: false` (tidak pernah ikut terkirim ke response API kecuali secara eksplisit) dan ditampilkan ter-mask di panel (`xxxx••••••••xxxx`).

Catatan desain: field "Isi Pesan" ditambahkan di luar daftar eksplisit karena diperlukan agar fitur kirim pesan benar-benar berfungsi (sebelumnya hanya token+mode+channel tanpa isi pesan).

Status: **Self-Service Buyer Panel Completed**

---

## v1.6.1 — Bersihkan Sisa Modul API Key Bot, Panel Token User Terhubung Penuh

Changed:
- Modul `ApiKey` (model, controller, routes, halaman frontend) **dihapus total** — sudah tidak terpakai sejak integrasi pindah ke buyer-token di v1.5.1.
- Panel admin "Integrasi Bot (API Key)" diganti jadi **"Token Integrasi (Token User)"** (`/admin/tokens`) — menampilkan token setiap user/buyer langsung dari data Manajemen Buyer, lengkap dengan tombol copy & regenerate.
- Buyer Dashboard sekarang menjelaskan eksplisit bahwa token miliknya dipakai untuk header `x-buyer-token` ke endpoint integrasi, dan terhubung otomatis ke riwayat post & riwayat aktivitas akunnya.
- Dibersihkan: `generateApiKey()`, `createApiKeySchema`, `ApiKeyDTO`, semua referensi `x-api-key`.
- Seluruh panel sekarang konsisten: satu jenis token (token user/buyer) dipakai untuk login, integrasi, dan tercatat di satu riwayat aktivitas yang sama — tidak ada lagi token bot terpisah.

Status: **Cleanup Completed**

---

## v1.6.0 — Automated Test Suite

Added:
- **Jest + ts-jest + Supertest** untuk backend, jalan dengan `pnpm test`
- **mongodb-memory-server** sebagai default DB test (in-memory, tidak menyentuh data asli) — dengan fallback ke `TEST_MONGO_URI` (mis. MongoDB lokal/Atlas) untuk lingkungan yang tidak bisa menjalankan binary mongod otomatis (misal Termux di Android)
- Guard keamanan: `TEST_MONGO_URI` WAJIB mengandung kata "test" di nama database-nya, supaya tidak ada risiko data production tertimpa/terhapus oleh test
- **nock** untuk mock HTTP request ke Discord webhook — test tidak pernah mengirim request asli ke Discord, dan semua koneksi jaringan non-localhost diblokir otomatis selama test berjalan
- Test coverage untuk seluruh sprint:
  - `health.test.ts` — cek endpoint health
  - `auth.test.ts` — register, login, validasi, akun nonaktif, refresh token, logout/revoke, buyer-token
  - `posts.test.ts` — create/validate/post-now (sukses & gagal)/cancel/delete, termasuk role-guard admin-only
  - `buyers.test.ts` — list, regenerate token, toggle aktif/nonaktif (dan efeknya ke login), delete
  - `integration.test.ts` — autentikasi `x-buyer-token`, trigger-post, activity log, buyer nonaktif diblokir
- **GitHub Actions workflow** (`.github/workflows/backend-tests.yml`) — test otomatis jalan tiap push/PR ke `main`/`master`

Cara jalanin:
```
pnpm install
pnpm --filter @microstore-auto-post/backend test
```

Status: **Testing Infrastructure Completed**

---

## v1.5.1 — Update: Integrasi Pakai Token Buyer (bukan API Key)

Changed:
- Endpoint `/api/integrations/*` sekarang diautentikasi memakai **buyer token milik user sendiri**
  (header `x-buyer-token`), menggantikan API key bersama yang dibuat admin.
- Middleware baru `buyerTokenAuth` (cek token ke koleksi `User`, role buyer, harus `isActive`).
- Setiap panggilan integrasi otomatis tercatat di `activityLogs` buyer terkait (`integration-call`).
- Post yang dibuat lewat trigger-post sekarang ter-attach ke `createdBy` = buyer pemilik token (sebelumnya `null`/anonim).
- Rate limiter integrasi sekarang dikunci per `x-buyer-token`, bukan per `x-api-key`.
- Halaman frontend "API Key Admin" diperjelas: tidak lagi dipakai untuk trigger-post, disediakan untuk kebutuhan API key admin umum di masa depan.
- Middleware `apiKeyAuth` lama (khusus integrasi) dihapus karena sudah tidak terpakai.

Status: **Update Completed**

---

## v1.5.0 — Sprint 5 (Hardening Produksi) — FINAL ROADMAP

Added:
- **Rate limiting** (`express-rate-limit`): limiter khusus auth (anti brute-force login), limiter umum di seluruh `/api`, limiter berbasis API key untuk endpoint integrasi
- **Validasi input** dengan `zod` di semua endpoint penting (login, register, create/update post, create API key, trigger-post) — request dengan field salah/kosong langsung ditolak dengan pesan jelas
- **Logging terstruktur** dengan `winston` (level, timestamp, JSON file log di `logs/error.log` & `logs/combined.log`, plus console berwarna saat development), menggantikan `console.log` polos
- **Refresh token**: login sekarang mengembalikan `token` (pendek, 7 hari) + `refreshToken` (panjang, 30 hari, disimpan di DB). Endpoint baru:
  - `POST /api/auth/refresh` — perpanjang akses tanpa login ulang
  - `POST /api/auth/logout` — mencabut refresh token di server
  - Frontend otomatis refresh token saat dapat 401, dan redirect ke login jika refresh token juga invalid
- **Security headers** via `helmet`
- **Dockerfile production** untuk backend (multi-stage build, Node 20 alpine) dan frontend (build Vite lalu disajikan via Nginx)
- `docker-compose.yml` production-ready: service `mongodb`, `backend`, `frontend` dengan volume persisten Mongo

Status: **Sprint 5 Completed — Proyek MICROSTORE AUTO POST v1.5.0 siap deploy production**

---

## v1.4.0 — Sprint 4 (Integrasi Bot Discord Utama)

Added:
- Model `ApiKey` untuk autentikasi service-to-service (bot Discord MICROSTORE utama ↔ Auto Post API)
- Middleware `apiKeyAuth` (header `x-api-key`), terpisah dari JWT admin/buyer
- Endpoint admin `/api/api-keys`: buat, list, revoke, hapus API key
- Endpoint integrasi `/api/integrations` (auth via API key, bukan JWT):
  - `GET /ping` — sanity check koneksi dari bot
  - `POST /trigger-post` — bot utama bisa memicu auto-post instan (misal saat ada penjualan/boost baru), otomatis tercatat sebagai `Post` di riwayat
- `DISCORD_LOG_WEBHOOK_URL` (opsional) — scheduler & integrasi mengirim notifikasi status (✅/❌) ke channel log bot utama setiap kali auto-post terkirim/gagal
- `INTEGRATION_DEFAULT_WEBHOOK_URL` (opsional) — fallback webhook jika bot tidak mengirim `webhookUrl` spesifik
- Frontend: halaman **Integrasi Bot (API Key)** untuk admin — generate API key (tampil sekali), lihat status & terakhir dipakai, revoke, hapus

Status: **Sprint 4 Completed**

---

## v1.3.0 — Sprint 3 (Manajemen Buyer Lanjutan)

Added:
- Field baru di model `User`: `isActive`, `lastLoginAt`, `activityLogs[]`
- Login & register buyer kini otomatis tercatat di `activityLogs`
- Login & semua request ter-autentikasi diblok jika buyer dinonaktifkan (`isActive: false`)
- Endpoint admin baru (`/api/buyers`):
  - List semua buyer
  - Detail buyer + riwayat aktivitas
  - Regenerate buyer token
  - Aktifkan / nonaktifkan buyer
  - Hapus buyer
- Frontend: halaman **Manajemen Buyer** untuk admin — tabel buyer dengan status aktif/nonaktif, tombol regenerate token, toggle status, lihat riwayat aktivitas (expand row), dan hapus buyer

Status: **Sprint 3 Completed**

---

## v1.2.0 — Sprint 2 (Modul Auto Post)

Added:
- Model `Post` (title, content, imageUrl, webhookUrl, scheduledAt, status, logs)
- CRUD Post penuh (admin only): create, list (filter by status), detail, update, delete
- Aksi `cancel` (batalkan post terjadwal) dan `post-now` (kirim manual, bypass jadwal)
- Service pengiriman ke **Discord Webhook** (embed otomatis, gambar opsional)
- **Scheduler** berbasis `node-cron` (cek tiap menit, kirim post yang sudah jatuh tempo, anti-overlap run)
- Log riwayat percobaan posting per-post (`logs[]`: attemptedAt, status, message)
- Frontend: halaman **Kelola Auto Post** untuk admin (form buat post terjadwal + tabel daftar post dengan badge status & aksi Post Now/Batal/Hapus)
- Tipe `PostDTO`, `PostStatus`, `PostLogDTO` di `packages/types`

Status: **Sprint 2 Completed**

---

## v1.1.0 — Sprint 1 (Implementasi Penuh)

Sebelumnya Sprint 1 hanya berupa struktur folder kosong. Versi ini melengkapi
seluruh implementasi sesuai rencana awal Sprint 1.

Added:
- Backend Express + TypeScript penuh (app.ts, server.ts, config env & DB)
- Koneksi MongoDB via Mongoose (`config/db.ts`)
- Model `User` (role admin/buyer, password hashing bcrypt, buyerToken)
- JWT authentication (sign & verify, middleware `authenticate`, `requireRole`)
- Endpoint: register buyer, login (admin & buyer), get profile (`/me`), get buyer token
- Script seed admin pertama (`seed:admin`)
- Error handler & 404 handler global
- Frontend React + Vite + TypeScript penuh:
  - Halaman Login (admin & buyer, satu form)
  - Admin Dashboard
  - Buyer Dashboard dengan tampilan & copy buyer token
  - AuthContext (simpan token & user di localStorage)
  - ProtectedRoute berbasis role
  - Tema dasar cyberpunk (dark + neon cyan/magenta), konsisten dengan tema MICROSTORE utama
- `packages/types` — tipe bersama (AuthUserDTO, ApiResponse, dll)
- `packages/shared` — util bersama (generateRandomCode, isValidUsername)

Status: **Sprint 1 Completed (Verified & Runnable)**

---

## v1.0.0 — Sprint 1 (Initial Scaffold)

Added:
- Project structure (folder kosong)
- Rencana stack: Express, React, MongoDB, JWT

Status: Sprint 1 Scaffold Only (tidak ada kode)

---

## Roadmap

Semua sprint Sprint 1–5 telah selesai:

- ~~**Sprint 1** — Foundation (Express+Mongo+JWT, React dashboard)~~ ✅
- ~~**Sprint 2** — Modul Auto Post~~ ✅
- ~~**Sprint 3** — Manajemen Buyer lanjutan~~ ✅
- ~~**Sprint 4** — Integrasi dengan MICROSTORE utama~~ ✅
- ~~**Sprint 5** — Hardening produksi~~ ✅

Ide pengembangan lanjutan (di luar roadmap awal, opsional untuk versi berikutnya):
- Multi-admin dengan permission granular (super-admin vs admin biasa)
- Dashboard analitik (jumlah post terkirim per hari, buyer aktif, dsb.)
- Notifikasi Telegram sebagai alternatif/tambahan selain Discord webhook
- Test otomatis (unit & integration test) untuk seluruh endpoint
