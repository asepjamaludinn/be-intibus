# Backend INTI Bus

Backend REST API untuk aplikasi **Smart Bus Display** (Flutter). Dibangun dengan **Express + TypeScript + Prisma (PostgreSQL)**, menyediakan sinkronisasi data rute, preset, state display, dan autentikasi perangkat berbasis **device pairing** (bukan API key statis).

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)

---

## Daftar Isi

- [Tentang Backend Ini](#tentang-backend-ini)
- [Alur Request](#alur-request)
- [Model Data (Prisma Schema)](#model-data-prisma-schema)
- [Detail Keamanan](#detail-keamanan)
- [Persiapan Lingkungan](#persiapan-lingkungan)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Database](#setup-database)
- [Menjalankan Server](#menjalankan-server)
- [Memasangkan Device Baru (Pairing)](#memasangkan-device-baru-pairing)
- [Dokumentasi API Endpoint](#dokumentasi-api-endpoint)
  - [Devices](#devices)
  - [Routes](#routes)
  - [Display](#display)
- [Format Response](#format-response)
- [Penanganan Error](#penanganan-error)
- [Keamanan yang Diterapkan](#keamanan-yang-diterapkan)
- [Panduan Maintenance](#panduan-maintenance)
  - [Menambah Endpoint Baru](#menambah-endpoint-baru)
  - [Menambah Model Database](#menambah-model-database)
  - [Konvensi Kode](#konvensi-kode)
- [Troubleshooting](#troubleshooting)
- [Dependency Utama](#dependency-utama)
- [Checklist Deployment Production](#checklist-deployment-production)

---

## Tentang Backend Ini

Server ini adalah pusat sinkronisasi data untuk aplikasi Smart Bus Display:

- Menyimpan **daftar rute** (kode, asal, tujuan) yang dapat diakses semua device terpasang.
- Menyimpan **preset** pengaturan display (kombinasi rute, arah, animasi, speed, brightness, fontSize).
- Menyimpan **state display terakhir** yang pernah dikirim ke panel (untuk keperluan audit/monitoring).
- Mengelola **autentikasi perangkat** lewat skema pairing token, bukan shared secret statis.

Pengiriman aktual ke panel LED dilakukan **langsung dari aplikasi Flutter via Bluetooth**, bukan dari server ini - server hanya menyimpan/menyinkronkan konfigurasi.

---

### Struktur Folder

```
├── prisma/
│   └── schema.prisma          # Definisi model database
├── scripts/
│   └── generate-pairing-code.ts  # CLI untuk membuat kode pairing device baru
├── src/
│   ├── config/
│   │   └── env.ts             # Validasi environment variable (fail-fast, Zod)
│   ├── controllers/
│   │   ├── device.controller.ts
│   │   ├── display.controller.ts
│   │   └── route.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # requireDeviceAuth — verifikasi token per-device
│   │   ├── error.middleware.ts    # globalErrorHandler
│   │   └── validate.middleware.ts # Validasi body request dengan Zod
│   ├── routes/
│   │   ├── device.routes.ts
│   │   ├── display.routes.ts
│   │   └── route.routes.ts
│   ├── schema/
│   │   ├── device.schema.ts       # Zod schema untuk pairing
│   │   └── display.schema.ts      # Zod schema untuk display/preset/route
│   ├── services/
│   │   ├── device.service.ts      # Logic pairing & verifikasi token
│   │   ├── display.service.ts     # Logic display state & preset
│   │   └── route.service.ts       # Logic CRUD rute
│   ├── types/
│   │   └── express/index.d.ts     # Augmentasi tipe Express.Request.device
│   ├── utils/
│   │   ├── AppError.ts            # Custom error class dengan statusCode
│   │   ├── crypto.ts              # Hashing token, timing-safe compare
│   │   └── prisma.ts              # Prisma client singleton
│   ├── app.ts                     # Setup Express app & middleware
│   └── server.ts                  # Entry point, app.listen()
├── .env                            # (tidak di-commit) konfigurasi lokal
└── package.json
```

---

## Model Data (Prisma Schema)

| Model          | Kegunaan                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| `Route`        | Daftar rute bus (`code` unique, kombinasi `origin`+`destination` unique)       |
| `Preset`       | Kombinasi pengaturan display tersimpan (`name` unique, `payload` JSON)         |
| `DisplayState` | State display terakhir yang dikirim (single row, id tetap `"CURRENT_STATE"`)   |
| `Device`       | Perangkat yang sudah dipasangkan (`deviceId` unique, `tokenHash`, `revokedAt`) |
| `PairingCode`  | Kode pairing sekali pakai dengan masa berlaku (`expiresAt`, `usedAt`)          |

```prisma
model Device {
  id         String    @id @default(uuid())
  deviceId   String    @unique
  name       String?
  tokenHash  String
  createdAt  DateTime  @default(now())
  lastSeenAt DateTime?
  revokedAt  DateTime?
}

model PairingCode {
  id        String    @id @default(uuid())
  code      String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

> Token asli perangkat **tidak pernah disimpan** - hanya `tokenHash` (SHA-256) yang tersimpan di database. Token asli hanya dikembalikan sekali ke client saat proses pairing berhasil.

---

### Detail Keamanan

| Mekanisme                                       | Implementasi                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Token tidak disimpan plain text                 | Hanya `sha256(token)` yang disimpan di DB                                                                                      |
| Perbandingan token aman dari timing attack      | `crypto.timingSafeEqual()` atas hash berpanjang tetap                                                                          |
| Anti device-enumeration                         | Perbandingan tetap dijalankan dengan `DUMMY_HASH` walau `deviceId` tidak ditemukan, sehingga waktu respons konsisten           |
| Kode pairing tidak bisa dibrute-force dari luar | Endpoint `/api/devices/pair` hanya menerima kode yang **dibuat lewat CLI server**, plus rate limit 5 percobaan/15 menit per IP |
| Kode pairing sekali pakai & kedaluwarsa         | `usedAt` + `expiresAt`, ditandai dalam transaksi atomik (race-safe)                                                            |
| Revoke akses per-device                         | Set `revokedAt` pada baris `Device` terkait — tidak memengaruhi device lain                                                    |

---

## Persiapan Lingkungan

| Tool              | Versi Minimum         |
| ----------------- | --------------------- |
| Node.js           | 18 LTS+               |
| PostgreSQL        | 14+                   |
| npm / pnpm / yarn | Sesuai `package.json` |

---

## Instalasi

```bash
git clone https://github.com/asepjamaludinn/be-intibus
cd be-intibus
npm install
```

---

## Konfigurasi Environment

Buat file `.env` di root project:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/smart_bus_display?schema=public"
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

| Variable          | Wajib  | Keterangan                                                                        |
| ----------------- | ------ | --------------------------------------------------------------------------------- |
| `NODE_ENV`        | Tidak  | `development` \| `production` \| `test` (default: `development`)                  |
| `PORT`            | Tidak  | Port server (default: `3000`)                                                     |
| `DATABASE_URL`    | **Ya** | Connection string PostgreSQL. Server **tidak akan start** jika ini kosong/invalid |
| `ALLOWED_ORIGINS` | Tidak  | Daftar origin yang diizinkan CORS, dipisah koma                                   |

> Validasi environment dilakukan **fail-fast** saat boot lewat `src/config/env.ts` (Zod). Jika ada variable wajib yang kosong/salah format, server langsung berhenti dengan pesan error yang jelas - tidak menunggu request pertama masuk.

---

## Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi (membuat semua tabel termasuk Device & PairingCode)
npx prisma migrate dev --name init

# (Opsional) Buka Prisma Studio untuk lihat/edit data via GUI
npx prisma studio
```

---

## Menjalankan Server

```bash
# Mode development (dengan hot-reload, jika dikonfigurasi tsx/nodemon)
npm run dev

# Build TypeScript → JavaScript
npm run build

# Jalankan hasil build (production)
npm start
```

Jika berhasil, akan muncul log:

```
[SERVER] Berjalan di http://localhost:3000 (development)
[INFO] Mode API Sinkronisasi aktif Bluetooth Mode
```

---

## Memasangkan Device Baru (Pairing)

Setiap kali ada perangkat Flutter baru yang perlu diaktifkan:

```bash
npm run pair:generate
```

Output:

```
KODE PAIRING DEVICE
Kode      : A7XK2P9Q
Berlaku   : 15 menit (sampai 16/8/2026, 14.35.00)
Masukkan kode ini di layar pairing pada aplikasi Smart Bus Display.
```

Berikan kode ini ke operator untuk dimasukkan di layar Pairing aplikasi. Kode otomatis tidak berlaku setelah dipakai satu kali atau melewati 15 menit.

Tambahkan script ini ke `package.json` jika belum ada:

```json
{
  "scripts": {
    "pair:generate": "tsx scripts/generate-pairing-code.ts"
  }
}
```

---

## Dokumentasi API Endpoint

Base URL: `http://<host>:<port>/api`

### Devices

#### `POST /devices/pair`

Menukar kode pairing dengan device token. **Tidak butuh autentikasi** (endpoint inilah yang menghasilkan kredensial).

Rate limit: 5 percobaan / 15 menit per IP.

**Request body:**

```json
{
  "code": "A7XK2P9Q",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Tablet Kondektur B1"
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Device berhasil dipasangkan",
  "data": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceToken": "9f8c7b6a5d4e3f2c1b0a..."
  }
}
```

---

### Routes

Semua endpoint mutasi (`POST`, `DELETE`) memerlukan header `x-device-id` + `x-device-token`.

#### `GET /routes`

Daftar semua rute. **Publik** (tidak butuh auth) — dipakai untuk sinkronisasi awal aplikasi.

```json
{
  "success": true,
  "data": [
    { "id": "...", "code": "B1", "origin": "Bandung", "destination": "Garut" }
  ]
}
```

#### `POST /routes`

```json
// Request
{ "code": "B5", "origin": "Bandung", "destination": "Lembang" }

// Response 201
{ "success": true, "message": "Rute berhasil ditambahkan", "data": { "id": "...", "code": "B5", ... } }
```

Error `409` jika kode atau kombinasi rute (termasuk arah sebaliknya) sudah terdaftar.

#### `DELETE /routes/:id`

```json
{ "success": true, "message": "Rute berhasil dihapus" }
```

---

### Display

#### `POST /display/send`

Menyinkronkan state display terakhir ke server (dipanggil otomatis oleh app setiap kirim ke panel).

```json
// Request
{
  "route": "B1 • Bandung - Garut",
  "direction": "Pergi",
  "animation": "Scroll Left",
  "speed": 50,
  "brightness": 80,
  "fontSize": 16
}

// Response 200
{ "success": true, "message": "...", "data": { ... } }
```

#### `GET /display/status`

Status server + state terakhir. **Publik.**

```json
{ "connected": true, "ip": "API Sync Server", "currentState": { ... } }
```

#### `POST /display/presets`

```json
// Request
{ "name": "Preset Pagi", "payload": { "route": "...", "direction": "Pergi", "animation": "...", "speed": 50, "brightness": 80, "fontSize": 16 } }

// Response 201
{ "success": true, "message": "Preset disimpan di database", "data": { "id": "...", "name": "Preset Pagi", ... } }
```

Error `409` jika nama preset sudah dipakai (case-insensitive).

#### `PUT /display/presets/:id`

Sama seperti `POST`, tapi menimpa preset yang sudah ada.

#### `GET /display/presets`

Daftar semua preset tersimpan, diurutkan terbaru dulu. **Publik.**

---

## Format Response

Semua response mengikuti format konsisten:

**Sukses:**

```json
{ "success": true, "message": "...", "data": { ... } }
```

**Gagal:**

```json
{ "success": false, "error": "Pesan error yang jelas" }
```

---

## Penanganan Error

Ditangani terpusat di `globalErrorHandler` (`middlewares/error.middleware.ts`):

| Sumber Error                          | Status Code                     | Penanganan                                       |
| ------------------------------------- | ------------------------------- | ------------------------------------------------ |
| `AppError` (custom, dilempar service) | Sesuai `statusCode` yang di-set | Pesan langsung ditampilkan ke client             |
| Prisma `P2002` (unique constraint)    | 409                             | "Data tersebut sudah terdaftar."                 |
| Prisma `P2025` (record not found)     | 404                             | "Data tidak ditemukan."                          |
| Prisma `P2003` (foreign key)          | 400                             | "Relasi data tidak valid."                       |
| `PrismaClientValidationError`         | 400                             | "Data tidak sesuai schema Prisma."               |
| Error tak terduga lainnya             | 500                             | Pesan error asli (log lengkap di console server) |

Semua error di-log lengkap ke console server (nama, message, stack, detail Prisma jika ada) - **tidak pernah** ditampilkan stack trace ke client.

---

## Keamanan yang Diterapkan

| Layer                 | Proteksi                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP headers          | `helmet()`                                                                                                                                   |
| CORS                  | Whitelist origin dari `ALLOWED_ORIGINS`; request tanpa origin (mobile app) selalu diizinkan — proteksi aktual ada di device auth, bukan CORS |
| Rate limiting global  | 100 request / 15 menit / IP                                                                                                                  |
| Rate limiting pairing | 5 percobaan / 15 menit / IP                                                                                                                  |
| Autentikasi mutasi    | Device token, hash SHA-256, `timingSafeEqual`                                                                                                |
| Validasi input        | Zod schema di setiap endpoint mutasi                                                                                                         |
| Environment           | Validasi fail-fast saat boot, tidak ada log kredensial (`DATABASE_URL` tidak pernah di-`console.log`)                                        |

---

## Panduan Maintenance

### Menambah Endpoint Baru

1. Definisikan Zod schema di `src/schema/` (jika endpoint menerima body).
2. Tambahkan fungsi business logic di `src/services/`.
3. Tambahkan controller tipis di `src/controllers/` yang hanya memanggil service dan membentuk response.
4. Daftarkan route di `src/routes/`, pasang `requireDeviceAuth` jika endpoint memerlukan autentikasi, dan `validate(schema)` jika ada body.
5. Jika model database baru dibutuhkan, ikuti langkah [Menambah Model Database](#menambah-model-database).

### Menambah Model Database

```bash
# 1. Tambahkan model baru di prisma/schema.prisma

# 2. Generate migrasi
npx prisma migrate dev --name nama_perubahan

# 3. Prisma Client otomatis ter-generate ulang
```

### Konvensi Kode

- **Bahasa pesan API:** Bahasa Indonesia, konsisten di seluruh endpoint.
- **Service tidak boleh mengetahui `Request`/`Response`** - hanya menerima/mengembalikan data biasa, controller yang menjembatani ke HTTP.
- **Semua error bisnis dilempar sebagai `AppError(message, statusCode)`**, jangan `throw new Error()` biasa kecuali untuk error tak terduga.
- **Jangan pernah `console.log` data sensitif** (connection string, token, password) - lesson learned dari refactor keamanan sebelumnya.
- **Token/secret tidak pernah disimpan plain text** - selalu hash sebelum masuk database.

---

## Troubleshooting

| Gejala                                                      | Kemungkinan Penyebab                                                | Solusi                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Server tidak mau start, error "KONFIGURASI ENV TIDAK VALID" | `DATABASE_URL` kosong atau bukan connection string PostgreSQL valid | Periksa `.env`, pastikan format `postgresql://user:pass@host:port/db`                               |
| `401 Unauthorized` terus-menerus dari app                   | Token device revoked, atau salah kirim header                       | Cek tabel `Device`, pastikan `revokedAt` null; cek header `x-device-id`/`x-device-token` di request |
| `429 Too Many Requests` saat pairing                        | Rate limit pairing tercapai (5x/15 menit)                           | Tunggu 15 menit, atau restart server (rate limit in-memory akan reset)                              |
| Error CORS di browser (bukan dari app mobile)               | Origin tidak ada di `ALLOWED_ORIGINS`                               | Tambahkan origin yang sesuai ke `.env`                                                              |
| `409 Conflict` saat generate pairing code beruntun          | Kode pairing sebelumnya belum expired dan konflik unique            | Ini normal — kode lama tetap valid, tunggu expired atau gunakan kode yang sudah dibuat              |

---

## Dependency Utama

| Package                    | Kegunaan                             |
| -------------------------- | ------------------------------------ |
| `express`                  | Web framework                        |
| `@prisma/client`, `prisma` | ORM ke PostgreSQL                    |
| `zod`                      | Validasi schema (env & request body) |
| `helmet`                   | Security HTTP headers                |
| `cors`                     | Cross-Origin Resource Sharing        |
| `express-rate-limit`       | Rate limiting                        |
| `pg`, `@prisma/adapter-pg` | PostgreSQL driver + Prisma adapter   |
