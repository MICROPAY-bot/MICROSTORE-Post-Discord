# MICROSTORE AUTO POST

Sprint 1 — Foundation (Fully Implemented)

Stack:
- Backend: Express + TypeScript + MongoDB (Mongoose) + JWT
- Frontend: React + Vite + TypeScript + React Router

## Struktur

```
apps/backend   -> REST API (auth, JWT, admin & buyer)
apps/frontend  -> Dashboard (login, admin panel, buyer panel)
packages/types  -> Tipe TypeScript yang dipakai bersama
packages/shared -> Util kecil yang dipakai bersama
```

## Menjalankan (lokal / Termux)

1. Salin `.env.example` menjadi `.env` di root, lalu copy isinya ke `apps/backend/.env` juga (atau set env langsung di Railway/host).
2. Pastikan MongoDB jalan. Untuk lokal cepat:
   ```
   docker compose up -d
   ```
   Atau gunakan MongoDB Atlas dan isi `MONGO_URI` di `.env`.
3. Install dependency:
   ```
   pnpm install
   ```
4. Seed akun admin pertama (username: `admin`, password: `admin123`):
   ```
   pnpm --filter @microstore-auto-post/backend seed:admin
   ```
5. Jalankan semua app (backend + frontend):
   ```
   pnpm dev
   ```
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

## Endpoint API

### Auth (Sprint 1)
| Method | Endpoint                  | Akses        | Keterangan                         |
|--------|----------------------------|--------------|-------------------------------------|
| GET    | /api/health                 | Publik       | Cek status server                   |
| POST   | /api/auth/register-buyer    | Publik       | Daftar akun buyer baru              |
| POST   | /api/auth/login             | Publik       | Login admin / buyer (JWT)           |
| GET    | /api/auth/me                | Login wajib  | Profil user yang sedang login       |
| GET    | /api/auth/buyer-token       | Buyer only   | Ambil/generate token unik buyer     |
| POST   | /api/auth/refresh           | Publik       | Perpanjang akses pakai refreshToken |
| POST   | /api/auth/logout            | Login wajib  | Cabut refresh token (logout server) |

### Auto Post (Sprint 2)
| Method | Endpoint                      | Akses      | Keterangan                                   |
|--------|---------------------------------|-----------|-----------------------------------------------|
| POST   | /api/posts                      | Admin only | Buat post terjadwal baru                       |
| GET    | /api/posts                      | Admin only | List semua post (filter `?status=`)            |
| GET    | /api/posts/:id                  | Admin only | Detail satu post                               |
| PUT    | /api/posts/:id                  | Admin only | Edit post (selama belum `posted`)              |
| DELETE | /api/posts/:id                  | Admin only | Hapus post                                      |
| PATCH  | /api/posts/:id/cancel            | Admin only | Batalkan post terjadwal                         |
| POST   | /api/posts/:id/post-now          | Admin only | Kirim post sekarang (bypass jadwal)            |

Scheduler berjalan otomatis setiap menit di background server, mengirim semua post dengan status `scheduled` yang `scheduledAt`-nya sudah lewat ke `webhookUrl` masing-masing (format Discord embed).

### Manajemen Buyer (Sprint 3)
| Method | Endpoint                          | Akses      | Keterangan                              |
|--------|-------------------------------------|-----------|-------------------------------------------|
| GET    | /api/buyers                         | Admin only | List semua buyer                          |
| GET    | /api/buyers/:id                     | Admin only | Detail buyer + riwayat aktivitas          |
| PATCH  | /api/buyers/:id/regenerate-token    | Admin only | Buat ulang buyer token                    |
| PATCH  | /api/buyers/:id/toggle-active        | Admin only | Aktifkan / nonaktifkan akun buyer         |
| DELETE | /api/buyers/:id                     | Admin only | Hapus buyer                                |

Buyer yang dinonaktifkan (`isActive: false`) tidak bisa login dan token JWT lamanya otomatis ditolak di semua request berikutnya.

### Integrasi Auto-Post via Token Buyer (Update Sprint 5.1)
| Method | Endpoint                          | Akses                          | Keterangan                                          |
|--------|-------------------------------------|---------------------------------|--------------------------------------------------------|
| GET    | /api/integrations/ping               | Header `x-buyer-token`          | Cek koneksi, memastikan token buyer valid               |
| POST   | /api/integrations/trigger-post       | Header `x-buyer-token`          | Buyer memicu auto-post instan pakai token miliknya sendiri |

Setiap buyer punya `buyerToken` unik (lihat Sprint 1 & 3). Token inilah yang dipakai untuk autentikasi ke endpoint integrasi — **bukan lagi API key bersama dari admin**. Ini berarti setiap user bertanggung jawab atas tokennya sendiri, dan admin tetap bisa mencabut akses lewat "Regenerate Token" atau "Nonaktifkan" di halaman Manajemen Buyer.

Contoh body untuk `trigger-post`:
```json
{
  "title": "Boost Server Terjual!",
  "content": "1x Boost Nitro berhasil terjual ke buyer XYZ.",
  "webhookUrl": "https://discord.com/api/webhooks/..."
}
```
Header wajib: `x-buyer-token: <buyerToken milik user yang bersangkutan>`.

Jika `DISCORD_LOG_WEBHOOK_URL` diisi di `.env`, setiap auto-post (baik dari scheduler maupun trigger buyer) akan mengirim notifikasi ringkas ke channel log tersebut.

Panel admin punya halaman **Token Integrasi** (`/admin/tokens`) yang menampilkan token setiap user/buyer, terhubung ke seluruh modul (Auto Post, Manajemen Buyer, riwayat aktivitas) — bukan lagi API key bot terpisah.

### Panel Self-Service Buyer: Auto Poster dengan Token Discord Sendiri (Sprint v1.7.0)

Buyer login ke `/buyer` dan mengisi **Discord Token miliknya sendiri** (bukan token sistem) untuk menjalankan auto-poster pribadi ke channel-channel Discord yang mereka tentukan sendiri.

| Method | Endpoint                          | Akses        | Keterangan                                          |
|--------|-------------------------------------|--------------|--------------------------------------------------------|
| GET    | /api/buyer-config/me                | Buyer (JWT)  | Ambil konfigurasi milik sendiri (token termasking)      |
| PUT    | /api/buyer-config/me                | Buyer (JWT)  | Simpan Discord Token, mode kirim, isi pesan, daftar channel |
| POST   | /api/buyer-config/me/start          | Buyer (JWT)  | Jalankan auto-poster (status → RUNNING)                 |
| POST   | /api/buyer-config/me/stop           | Buyer (JWT)  | Hentikan auto-poster (status → STOP)                     |
| GET    | /api/buyer-config/me/logs           | Buyer (JWT)  | Live log (dipakai polling tiap 5 detik oleh panel)        |
| PATCH  | /api/buyers/:id/license              | Admin (JWT)  | Atur status lisensi (active/expired) & tanggal kedaluwarsa |

Urutan panel Buyer Dashboard:
1. Nama Store "MICROSTORE"
2. Status: Status (Running/Stop), Lisensi (Active/Expired), Jumlah Channel, Lisensi Date
3. Konfigurasi Pesan: Discord Token Buyer, Mode Kirim (Embed/Biasa), Isi Pesan, Daftar Channel (Channel ID + Delay menit, maks 10)
4. Live Log Auto
5. Tombol RUNNING / STOP / SAVE KONFIGURASI
6. Tombol ke Server Discord MICROSTORE
7. Info akun + Logout

Scheduler internal (`buyerAutoPosterScheduler.ts`) berjalan tiap menit, mengirim pesan ke tiap channel sesuai delay masing-masing (independen per channel), memakai Discord Token milik buyer yang bersangkutan via Discord REST API. Token disimpan ter-mask di response API dan tidak pernah dikirim balik secara utuh ke client setelah disimpan.

## Testing Otomatis

Backend punya test suite (Jest + Supertest) yang menutupi semua sprint: auth, refresh token, auto-post, manajemen buyer, dan integrasi buyer-token.

```
pnpm install
pnpm --filter @microstore-auto-post/backend test
```

Secara default, test memakai `mongodb-memory-server` (MongoDB in-memory, auto-download binary saat pertama jalan, tidak menyentuh database asli).

**Catatan untuk Termux/Android:** binary `mongod` yang didownload otomatis oleh `mongodb-memory-server` dikompilasi untuk Linux glibc biasa, dan **kemungkinan besar tidak akan jalan di Termux** (yang pakai Android/Bionic libc). Kalau `pnpm test` gagal karena ini, ada 2 opsi:

1. **Pakai MongoDB asli yang sudah jalan** (misal lewat `docker compose up -d mongodb` di VPS/PC, atau MongoDB Atlas gratis), lalu set:
   ```
   TEST_MONGO_URI=mongodb://localhost:27017/microstore_test pnpm --filter @microstore-auto-post/backend test
   ```
   ⚠️ Nama database WAJIB mengandung kata `test` (misal `microstore_test`) — ini wajib dicek otomatis oleh test setup, supaya tidak ada risiko data production kehapus (test menghapus semua data di DB yang dipakai setiap selesai satu file test).

2. **Jalankan test di GitHub Actions** — sudah disiapkan workflow di `.github/workflows/backend-tests.yml`, otomatis jalan tiap kamu push/PR ke branch `main`/`master`. Ini cara paling gampang kalau dev sehari-hari di Termux: push dulu, biarkan CI yang nge-tes di server Ubuntu yang pasti kompatibel.

Test tidak pernah mengirim request asli ke Discord — semua webhook di-mock pakai `nock`, dan koneksi jaringan ke luar selain localhost diblokir otomatis selama test berjalan.

## Catatan Penting

- **Ganti password admin default** setelah deploy ke production.
- `JWT_SECRET` dan `JWT_REFRESH_SECRET` di `.env` WAJIB diganti dengan string acak yang kuat sebelum production (gunakan dua secret yang berbeda).
- Buyer token (`buyerToken`) adalah identitas unik per buyer, dipakai untuk fitur auto-post / integrasi.

## Hardening Produksi (Sprint 5)

- **Rate limiting** aktif di seluruh `/api` (umum), lebih ketat khusus di endpoint login/register, dan berbasis per-API-key di endpoint integrasi bot.
- **Validasi input** (zod) menolak request dengan data tidak valid sebelum masuk ke controller.
- **Logging terstruktur** (winston) — cek `logs/error.log` dan `logs/combined.log` di server untuk audit/debug production.
- **Refresh token** — token akses berlaku 7 hari, refresh token 30 hari; bisa diperpanjang tanpa login ulang lewat `/api/auth/refresh`, dan dicabut lewat `/api/auth/logout`.
- **Helmet** mengaktifkan security headers standar (X-Frame-Options, dll).

### Deploy dengan Docker (production)

```
docker compose up -d --build
```

Ini akan menjalankan 3 service: `mongodb` (port 27017), `backend` (port 5000), `frontend` (port 8080, statis via Nginx). Pastikan `.env` di root sudah diisi dengan secret production sebelum menjalankan ini.

### Deploy ke Railway

- Deploy `apps/backend` sebagai service Node (gunakan `Dockerfile` di `apps/backend/` atau build command `pnpm --filter @microstore-auto-post/backend build` + start command `pnpm --filter @microstore-auto-post/backend start`).
- Set semua environment variable dari `.env.example` di Railway dashboard.
- Frontend bisa dideploy sebagai static site (Railway/Vercel/Netlify) dengan build command `pnpm --filter @microstore-auto-post/frontend build`, output folder `apps/frontend/dist`.
