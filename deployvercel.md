# 🚀 Deploy Superapps ke Vercel — Panduan Lengkap & Terperinci

> **Monorepo:** Turborepo + pnpm workspaces  
> **Apps:** Hub (port 3000) · MyKanz (port 3001) · BitMove (port 3002)  
> **Database:** 3 Supabase PostgreSQL (Auth shared, MyKanz dedicated, BitMove dedicated)  
> **GitHub Repo:** https://github.com/roisanwr/superapps

---

## 📋 Daftar Isi

1. [Arsitektur & Apa yang Masuk GitHub](#1-arsitektur--apa-yang-masuk-github)
2. [Pra-Syarat Sebelum Deploy](#2-pra-syarat-sebelum-deploy)
3. [Persiapan Database Supabase](#3-persiapan-database-supabase)
4. [Setup GitHub Repository](#4-setup-github-repository)
5. [Buat Project Vercel — Hub (Main App)](#5-buat-project-vercel--hub-main-app)
6. [Buat Project Vercel — MyKanz](#6-buat-project-vercel--mykanz)
7. [Buat Project Vercel — BitMove](#7-buat-project-vercel--bitmove)
8. [Konfigurasi Environment Variables di Vercel](#8-konfigurasi-environment-variables-di-vercel)
9. [Fix vercel.json di Masing-Masing App](#9-fix-verceljson-di-masing-masing-app)
10. [Konfigurasi Multi-Zone (Rewrite URLs)](#10-konfigurasi-multi-zone-rewrite-urls)
11. [Urutan Deploy & Alur yang Benar](#11-urutan-deploy--alur-yang-benar)
12. [Verifikasi Setelah Deploy](#12-verifikasi-setelah-deploy)
13. [Troubleshooting Umum](#13-troubleshooting-umum)
14. [Checklist Akhir](#14-checklist-akhir)

---

## 1. Arsitektur & Apa yang Masuk GitHub

### Struktur Monorepo

```
superapps/                        ← Root monorepo (1 GitHub repo)
├── apps/
│   ├── hub/                      ← App utama (SSO + landing + Multi-Zone gateway)
│   ├── mykanz/                   ← App finance (basePath: /finance)
│   └── bitmove/                  ← App quests/gamification (basePath: /quests)
├── packages/
│   ├── db-auth/                  ← Package DB shared (Supabase Auth DB)
│   ├── db-mykanz/                ← Package DB MyKanz (Supabase MyKanz DB)
│   ├── db-bitmove/               ← Package DB BitMove (Supabase BitMove DB)
│   ├── config/                   ← Shared ESLint/TS configs
│   └── ui/                       ← Shared UI components
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### ✅ File yang MASUK ke GitHub (di-push)

| File/Folder | Keterangan |
|---|---|
| `apps/**` | Source code semua aplikasi |
| `packages/**` | Source code semua shared packages |
| `turbo.json` | Konfigurasi Turborepo |
| `pnpm-workspace.yaml` | Konfigurasi pnpm workspaces |
| `package.json` (root) | Scripts & devDependencies root |
| `pnpm-lock.yaml` | Lockfile pnpm (WAJIB di push) |
| `*.sql` (bitmove.sql, mykanz.sql) | SQL schema dump (opsional, ada di gitignore |
| `apps/bitmove/vercel.json` | Vercel config untuk bitmove |
| `packages/*/drizzle.config.ts` | Drizzle config (tidak mengandung secret) |
| `apps/*/middleware.ts` | Middleware JWT |
| `.gitignore` | Gitignore rules |

### ❌ File yang TIDAK MASUK GitHub (di-ignore)

| File/Folder | Keterangan |
|---|---|
| `**/.env` | **Semua env files** — TIDAK boleh di-push! |
| `**/.env.local` | Env local override |
| `**/node_modules/` | Dependencies |
| `**/.next/` | Next.js build output |
| `**/dist/` | Build artifacts |
| `**/.turbo/` | Turbo cache |
| `**/*.tsbuildinfo` | TypeScript build info |

> ⚠️ **PENTING:** Semua **database credentials** dan **JWT secrets** HARUS disimpan di Vercel Environment Variables — BUKAN di repository!

### Peta 3 Database

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Auth DB (ap-southeast-1)                          │
│  Project: voxbajabuinyybxlldqo                              │
│  Dipakai oleh: HUB + MYKANZ + BITMOVE (shared SSO)         │
│  Env: AUTH_DATABASE_URL                                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Supabase MyKanz DB (ap-southeast-1)                        │
│  Project: dnheeegbbujbrsoawpnu                              │
│  Dipakai oleh: MYKANZ saja                                  │
│  Env: MYKANZ_DATABASE_URL                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Supabase BitMove DB (ap-northeast-1)                       │
│  Project: vywkwfmgxzhbbwiuybbx                              │
│  Dipakai oleh: BITMOVE saja                                  │
│  Env: BITMOVE_DATABASE_URL                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Pra-Syarat Sebelum Deploy

Pastikan semua ini sudah siap:

- [ ] Akun Vercel aktif di https://vercel.com
- [ ] GitHub repository: https://github.com/roisanwr/superapps (sudah ada)
- [ ] 3 Supabase project aktif (Auth, MyKanz, BitMove)
- [ ] pnpm terinstall di local (`npm i -g pnpm`)
- [ ] `pnpm build` lokal berhasil tanpa error

### Generate JWT Secret yang Kuat

Sebelum deploy, generate dua JWT secret yang kuat. Jalankan ini di terminal:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (jalankan lagi untuk nilai berbeda)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Simpan kedua nilai ini — akan dipakai di semua 3 Vercel project dengan **nilai yang IDENTIK** (penting untuk SSO).

---

## 3. Persiapan Database Supabase

Database Supabase sudah ada, tapi ada beberapa setting yang perlu dicek/dikonfigurasi sebelum deploy.

### 3.1 Pastikan Supabase Pakai Connection Pooling (Transaction Mode)

Vercel menggunakan **serverless functions** yang membuka koneksi baru di setiap request. Tanpa connection pooling, Supabase akan kehabisan koneksi. Kita sudah pakai Supavisor (port **6543**) — sudah benar.

Verifikasi format URL koneksi (sudah benar di project ini):
```
# ✅ BENAR — pakai port 6543 (Supavisor/pooling)
postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# ❌ SALAH — jangan pakai port 5432 (direct connection, akan timeout di serverless)
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3.2 Cek IP Allow List di Supabase

Vercel deploy dari banyak IP. Pastikan Supabase tidak membatasi IP:

1. Buka Supabase Dashboard → Settings → **Database**
2. Scroll ke bawah ke **"Network Restrictions"**
3. Pastikan **tidak ada** IP restriction yang aktif, atau tambahkan `0.0.0.0/0` untuk allow all (aman karena auth sudah di level password)

### 3.3 Verifikasi Schema Database Sudah Terupload

Schema harus sudah ada di Supabase sebelum deploy. Untuk verifikasi:

**Auth DB (Supabase project: voxbajabuinyybxlldqo):**
- Login ke Supabase → SQL Editor
- Jalankan: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- Harus ada tabel: `users`, `refresh_tokens` (atau tabel auth yang sudah dibuat)

**MyKanz DB (Supabase project: dnheeegbbujbrsoawpnu):**
- Harus ada tabel: `profiles`, `transactions`, `budgets`, `categories`, dll (sesuai `mykanz.sql`)

**BitMove DB (Supabase project: vywkwfmgxzhbbwiuybbx):**
- Harus ada tabel: `profiles`, `quests`, `tasks`, `exercises`, `training_programs`, dll (sesuai `bitmove.sql`)

Jika schema belum ada, jalankan drizzle push dari local:

```bash
# Push schema Auth DB
cd packages/db-auth
AUTH_DATABASE_URL="postgresql://postgres.voxbajabuinyybxlldqo:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" pnpm db:push

# Push schema MyKanz DB
cd packages/db-mykanz
MYKANZ_DATABASE_URL="postgresql://postgres.dnheeegbbujbrsoawpnu:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" pnpm db:push

# Push schema BitMove DB
cd packages/db-bitmove
BITMOVE_DATABASE_URL="postgresql://postgres.vywkwfmgxzhbbwiuybbx:M3l3duk210409@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres" pnpm db:push
```

---

## 4. Setup GitHub Repository

### 4.1 Pastikan Semua File Ter-push

```bash
cd /home/taqisanw/Projects/superapps

# Cek status
git status

# Pastikan tidak ada file penting yang belum di-commit
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin master
```

### 4.2 Pastikan .gitignore Sudah Benar

File `.gitignore` di root monorepo sudah mengabaikan `.env` — **PASTIKAN tidak ada `.env` yang ter-push ke GitHub!**

```bash
# Verifikasi tidak ada .env di GitHub
git ls-files | grep ".env"
# Harusnya output KOSONG — jika ada, segera hapus dari tracking:
# git rm --cached apps/hub/.env
# git commit -m "fix: remove env file from tracking"
```

---

## 5. Buat Project Vercel — Hub (Main App)

Hub adalah **pintu utama** (Multi-Zone gateway) yang akan me-rewrite request ke MyKanz dan BitMove. Deploy ini **harus dilakukan terakhir** setelah URL MyKanz dan BitMove sudah diketahui.

> 💡 **Urutan Deploy:** BitMove → MyKanz → Hub (karena Hub butuh URL dari dua app lainnya)

### 5.1 Tambah vercel.json untuk Hub

Buat file `apps/hub/vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/hub",
  "outputDirectory": "apps/hub/.next"
}
```

### 5.2 Import Project Hub di Vercel

1. Buka https://vercel.com/new
2. Klik **"Import Git Repository"**
3. Pilih repository `roisanwr/superapps`
4. Konfigurasi:
   - **Project Name:** `superapps` ← hasilnya `superapps.vercel.app`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/hub` ← **WAJIB DIISI INI**
   - **Build Command:** `cd ../.. && pnpm turbo run build --filter=@superapp/hub`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
   - **Output Directory:** `.next` (biarkan default)

5. Klik **"Environment Variables"** → isi semua env (lihat [Bagian 8](#8-konfigurasi-environment-variables-di-vercel))
6. Klik **"Deploy"**

---

## 6. Buat Project Vercel — MyKanz

### 6.1 Tambah/Update vercel.json untuk MyKanz

Buat/update file `apps/mykanz/vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/mykanz",
  "outputDirectory": "apps/mykanz/.next"
}
```

### 6.2 Import Project MyKanz di Vercel

1. Buka https://vercel.com/new
2. Klik **"Import Git Repository"**
3. Pilih repository `roisanwr/superapps`
4. Konfigurasi:
   - **Project Name:** `superapps-mykanz`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/mykanz` ← **WAJIB DIISI INI**
   - **Build Command:** `cd ../.. && pnpm turbo run build --filter=@superapp/mykanz`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
5. Isi Environment Variables (lihat [Bagian 8](#8-konfigurasi-environment-variables-di-vercel))
6. Deploy
7. **Catat URL deployment** misalnya: `https://superapps-mykanz.vercel.app`

---

## 7. Buat Project Vercel — BitMove

### 7.1 Update vercel.json untuk BitMove

File `apps/bitmove/vercel.json` saat ini masih lama (pakai prisma). **Harus diupdate:**

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/bitmove",
  "outputDirectory": "apps/bitmove/.next"
}
```

> ⚠️ **File `apps/bitmove/vercel.json` saat ini masih berisi `"buildCommand": "prisma generate && next build"` — ini harus diganti dengan yang di atas sebelum deploy!**

### 7.2 Import Project BitMove di Vercel

1. Buka https://vercel.com/new
2. Klik **"Import Git Repository"**
3. Pilih repository `roisanwr/superapps`
4. Konfigurasi:
   - **Project Name:** `superapps-bitmove`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/bitmove` ← **WAJIB DIISI INI**
   - **Build Command:** `cd ../.. && pnpm turbo run build --filter=@superapp/bitmove`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
5. Isi Environment Variables (lihat [Bagian 8](#8-konfigurasi-environment-variables-di-vercel))
6. Deploy
7. **Catat URL deployment** misalnya: `https://superapps-bitmove.vercel.app`

---

## 8. Konfigurasi Environment Variables di Vercel

Ini bagian paling kritis. Setiap Vercel project punya Environment Variables sendiri. Isi dengan teliti.

### 8.1 Hub Environment Variables

Buka Vercel → Project `superapps-hub` → Settings → Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `AUTH_DATABASE_URL` | `postgresql://postgres.voxbajabuinyybxlldqo:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase Auth DB |
| `JWT_SECRET` | `[generate baru — minimal 64 karakter hex]` | **WAJIB SAMA** di semua app! |
| `JWT_REFRESH_SECRET` | `[generate baru — minimal 64 karakter hex]` | **WAJIB SAMA** di semua app! |
| `NEXT_PUBLIC_APP_URL` | `https://superapps.vercel.app` | URL production Hub |
| `MYKANZ_URL` | `https://superapps-mykanz.vercel.app` | URL production MyKanz |
| `BITMOVE_URL` | `https://superapps-bitmove.vercel.app` | URL production BitMove |
| `NODE_ENV` | `production` | |

### 8.2 MyKanz Environment Variables

Buka Vercel → Project `superapps-mykanz` → Settings → Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `AUTH_DATABASE_URL` | `postgresql://postgres.voxbajabuinyybxlldqo:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase Auth DB (sama dengan Hub) |
| `MYKANZ_DATABASE_URL` | `postgresql://postgres.dnheeegbbujbrsoawpnu:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase MyKanz DB |
| `JWT_SECRET` | `[NILAI IDENTIK dengan Hub]` | **WAJIB SAMA** untuk SSO! |
| `JWT_REFRESH_SECRET` | `[NILAI IDENTIK dengan Hub]` | **WAJIB SAMA** untuk SSO! |
| `NEXT_PUBLIC_APP_URL` | `https://superapps.vercel.app` | URL Hub (bukan MyKanz!) |
| `NODE_ENV` | `production` | |

### 8.3 BitMove Environment Variables

Buka Vercel → Project `superapps-bitmove` → Settings → Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `AUTH_DATABASE_URL` | `postgresql://postgres.voxbajabuinyybxlldqo:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase Auth DB (sama dengan Hub) |
| `BITMOVE_DATABASE_URL` | `postgresql://postgres.vywkwfmgxzhbbwiuybbx:M3l3duk210409@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres` | Supabase BitMove DB |
| `JWT_SECRET` | `[NILAI IDENTIK dengan Hub]` | **WAJIB SAMA** untuk SSO! |
| `JWT_REFRESH_SECRET` | `[NILAI IDENTIK dengan Hub]` | **WAJIB SAMA** untuk SSO! |
| `NEXT_PUBLIC_APP_URL` | `https://superapps.vercel.app` | URL Hub (bukan BitMove!) |
| `NODE_ENV` | `production` | |

> 🔐 **Catatan Keamanan:** Password database dan JWT secret yang ada di atas adalah nilai dari file `.env` local. Untuk production, **sangat disarankan** untuk:
> 1. Ganti password Supabase ke nilai yang lebih kuat di Supabase Dashboard → Settings → Database → Reset database password
> 2. Generate JWT_SECRET dan JWT_REFRESH_SECRET baru yang belum pernah diekspos

---

## 9. Fix vercel.json di Masing-Masing App

### Mengapa Ini Penting?

Vercel butuh tahu cara build monorepo. Secara default, Vercel akan coba build hanya folder yang dipilih sebagai Root Directory — tapi dependencies kita ada di root (`pnpm-lock.yaml`). Konfig `cd ../..` di install/build command memastikan Vercel install dari root monorepo.

### Buat/Update semua vercel.json sekarang:

✅ **Semua file `vercel.json` sudah dibuat/diupdate** — tinggal push ke GitHub:

```bash
cd /home/taqisanw/Projects/superapps
git add apps/hub/vercel.json apps/mykanz/vercel.json apps/bitmove/vercel.json
git commit -m "chore: add vercel.json configs for monorepo deployment"
git push origin master
```

**Isi ketiga file `vercel.json` yang sudah dibuat:**

```json
// apps/hub/vercel.json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/hub",
  "outputDirectory": ".next"
}

// apps/mykanz/vercel.json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/mykanz",
  "outputDirectory": ".next"
}

// apps/bitmove/vercel.json  (sudah di-fix dari yang lama pakai Prisma)
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@superapp/bitmove",
  "outputDirectory": ".next"
}
```

> 💡 **Catatan `outputDirectory`:** Nilai `.next` ini relatif terhadap **Root Directory** yang kamu set di Vercel (`apps/hub`, `apps/mykanz`, `apps/bitmove`). Bukan relatif ke root monorepo.

---

## 10. Konfigurasi Multi-Zone (Rewrite URLs)

### Cara Kerja Multi-Zone di Project Ini

Hub menggunakan `rewrites()` di `apps/hub/next.config.ts` untuk mem-proxy request ke MyKanz dan BitMove:

```
User buka: https://superapps.vercel.app/finance/dashboard
         → Hub rewrite → https://superapps-mykanz.vercel.app/finance/dashboard

User buka: https://superapps.vercel.app/quests/overview
         → Hub rewrite → https://superapps-bitmove.vercel.app/quests/overview
```

### Verifikasi next.config.ts Hub

File `apps/hub/next.config.ts` sudah benar:

```typescript
// Ini sudah ada, JANGAN UBAH
async rewrites() {
  return [
    {
      source: "/finance/:path*",
      destination: `${process.env.MYKANZ_URL || "http://localhost:3001"}/finance/:path*`,
    },
    {
      source: "/quests/:path*",
      destination: `${process.env.BITMOVE_URL || "http://localhost:3002"}/quests/:path*`,
    },
  ];
},
```

### Verifikasi basePath di MyKanz dan BitMove

- `apps/mykanz/next.config.ts` → `basePath: "/finance"` ✅
- `apps/bitmove/next.config.ts` → `basePath: "/quests"` ✅

### Setup Cookie Cross-Domain untuk SSO

Karena 3 app deploy ke domain berbeda di Vercel, cookie `access_token` perlu bisa dibaca antar domain. Ada dua opsi:

**Opsi A (Mudah — Pakai Custom Domain Satu Domain):**
Arahkan semua ke subdomain yang sama misalnya:
- `app.roisanwr.com` → Hub
- `app.roisanwr.com/finance/...` → di-rewrite ke MyKanz
- `app.roisanwr.com/quests/...` → di-rewrite ke BitMove

Dengan ini SSO cookie bekerja otomatis karena satu domain.

**Opsi B (Tanpa Custom Domain — pakai vercel.app):**
Karena domain berbeda (mis. `hub.vercel.app` vs `mykanz.vercel.app`), cookie tidak otomatis shared. Hub me-*rewrite* request (bukan redirect), jadi cookie tetap terbawa. Ini sudah benar karena Multi-Zone pakai **rewrite** bukan redirect.

---

## 11. Urutan Deploy & Alur yang Benar

### Urutan yang BENAR:

```
STEP 1: Import ketiga project ke Vercel sekaligus (BitMove, MyKanz, Hub)
        → Gunakan nama project:
           superapps-bitmove  →  superapps-bitmove.vercel.app
           superapps-mykanz   →  superapps-mykanz.vercel.app
           superapps          →  superapps.vercel.app

STEP 2: Isi semua Environment Variables di ketiga project SEBELUM trigger build
        → Karena URL sudah diprediksi, bisa isi semua sekaligus
        → PASTIKAN JWT_SECRET identik di ketiga project!

STEP 3: Trigger Deploy (bisa serentak)
        → Karena env sudah diisi dengan URL yang benar, Hub
           langsung bisa build dengan rewrite yang tepat
```

### Kenapa Urutan Ini Ada?

`next.config.ts` di Hub menggunakan `process.env.MYKANZ_URL` dan `process.env.BITMOVE_URL` di dalam fungsi `rewrites()`. Nilai ini dibaca **saat Hub di-build** (build time), bukan saat user akses. Jadi Hub butuh tahu URL production MyKanz dan BitMove **sebelum** Hub di-build agar rewrite-nya benar.

### ✅ Tapi Kita Sudah Bisa Prediksi URL-nya!

Karena URL Vercel ditentukan dari **nama project** yang kita pilih sendiri, kita bisa set semua env variable terlebih dahulu tanpa harus menunggu deployment selesai:

| Project Name | URL Vercel |
|---|---|
| `superapps` | `superapps.vercel.app` |
| `superapps-mykanz` | `superapps-mykanz.vercel.app` |
| `superapps-bitmove` | `superapps-bitmove.vercel.app` |

Dengan URL yang sudah diprediksi, **tidak ada hambatan urutan** — ketiga app bisa di-import ke Vercel bersamaan, asalkan semua env variable sudah diisi dengan benar sebelum build dijalankan.

---

## 12. Verifikasi Setelah Deploy

### 12.1 Cek Build Logs

Di Vercel → setiap project → Deployments → klik deployment terbaru → **View Build Logs**

Pastikan tidak ada error seperti:
- `Cannot find module`
- `Error: DATABASE_URL is not defined`
- `Type error:` (TypeScript errors)

### 12.2 Test Fungsionalitas

**Test urutan:**

1. **Auth Flow:**
   ```
   Buka: https://superapps-hub.vercel.app/register
   → Daftar akun baru
   → Cek redirect ke /dashboard
   ```

2. **MyKanz via Hub:**
   ```
   Buka: https://superapps-hub.vercel.app/finance/dashboard
   → Harusnya tampil halaman finance MyKanz
   → Cek console browser: tidak ada 401/403 error
   ```

3. **BitMove via Hub:**
   ```
   Buka: https://superapps-hub.vercel.app/quests
   → Harusnya tampil halaman quests BitMove
   ```

4. **Database Connection:**
   ```
   Test login → jika berhasil, Auth DB terhubung ✅
   Test tambah transaksi di MyKanz → MyKanz DB terhubung ✅
   Test lihat quests di BitMove → BitMove DB terhubung ✅
   ```

### 12.3 Cek Environment Variables Sudah Terset

Di Vercel → Functions → klik salah satu function → lihat apakah env terbaca.

Atau tambahkan sementara endpoint debug di Hub:

```typescript
// apps/hub/app/api/health/route.ts (hapus setelah selesai test!)
export async function GET() {
  return Response.json({
    hasAuthDb: !!process.env.AUTH_DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    mykanzUrl: process.env.MYKANZ_URL,
    bitmoveUrl: process.env.BITMOVE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
```

Akses `https://superapps-hub.vercel.app/api/health` untuk verifikasi.

---

## 13. Troubleshooting Umum

### ❌ Error: "Cannot find module '@woilaa/db-auth'"

**Penyebab:** Vercel build dari root directory yang salah dan tidak menemukan workspace packages.

**Solusi:**
1. Pastikan **Root Directory** di Vercel settings sudah diisi dengan benar (misalnya `apps/hub`)
2. Pastikan `vercel.json` menggunakan `cd ../..` sebelum build command
3. Pastikan `pnpm-lock.yaml` sudah di-push ke GitHub

---

### ❌ Error: "Environment variable AUTH_DATABASE_URL is missing"

**Penyebab:** Env variable belum diset di Vercel project.

**Solusi:**
1. Buka Vercel → Project → Settings → Environment Variables
2. Tambahkan semua variable dari [Bagian 8](#8-konfigurasi-environment-variables-di-vercel)
3. Redeploy (bukan hanya save — harus trigger deploy baru)

---

### ❌ Error: "prisma generate" atau referensi Prisma

**Penyebab:** `apps/bitmove/vercel.json` masih menggunakan command lama dengan Prisma.

**Solusi:** Update `apps/bitmove/vercel.json` seperti di [Bagian 9](#9-fix-verceljson-di-masing-masing-app).

---

### ❌ Error: Multi-Zone rewrite tidak bekerja (404 di /finance atau /quests)

**Penyebab:** `MYKANZ_URL` atau `BITMOVE_URL` di Hub mengarah ke URL yang salah atau belum diset.

**Solusi:**
1. Cek env variable `MYKANZ_URL` dan `BITMOVE_URL` di Hub sudah benar
2. Pastikan MyKanz dan BitMove sudah deploy dan URL-nya sudah benar
3. **Redeploy Hub** setelah mengupdate env variables

---

### ❌ Error: SSO Tidak Bekerja (Login di Hub tapi MyKanz/BitMove minta login lagi)

**Penyebab:** `JWT_SECRET` berbeda antara Hub, MyKanz, dan BitMove.

**Solusi:**
1. Pastikan nilai `JWT_SECRET` **PERSIS SAMA** (copy-paste, bukan reketik) di ketiga project
2. Pastikan nilai `JWT_REFRESH_SECRET` **PERSIS SAMA** di ketiga project
3. Redeploy semua app setelah update

---

### ❌ Error: Database connection timeout

**Penyebab:** Menggunakan direct connection (port 5432) bukan pooled connection (port 6543).

**Solusi:** Gunakan URL dengan port **6543** (Supavisor pooler) — bukan **5432** (direct).

---

### ❌ Build Lambat / Timeout di Vercel

**Penyebab:** Turbo cache tidak aktif di Vercel.

**Solusi:** Aktifkan Vercel Remote Caching untuk Turborepo:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link Turborepo ke Vercel Remote Cache
cd /home/taqisanw/Projects/superapps
npx turbo login
npx turbo link
```

---

## 14. Checklist Akhir

Gunakan checklist ini sebelum dan setelah deploy:

### Sebelum Deploy

- [ ] `git status` bersih, semua di-push ke GitHub
- [ ] Tidak ada file `.env` yang ter-track di git (`git ls-files | grep .env` harus kosong)
- [ ] `apps/bitmove/vercel.json` sudah diupdate (hapus referensi prisma)
- [ ] `apps/hub/vercel.json` sudah dibuat
- [ ] `apps/mykanz/vercel.json` sudah dibuat
- [ ] JWT Secret baru sudah di-generate (minimal 64 karakter hex)
- [ ] Password Supabase sudah diganti ke yang lebih kuat (opsional tapi recommended)
- [ ] Schema database sudah ada di semua 3 Supabase project

### Saat Setup Vercel

- [ ] Root Directory sudah diisi dengan benar di setiap project
  - Hub → `apps/hub`
  - MyKanz → `apps/mykanz`
  - BitMove → `apps/bitmove`
- [ ] Semua Environment Variables sudah diisi di setiap project
- [ ] JWT_SECRET dan JWT_REFRESH_SECRET **IDENTIK** di ketiga project

### Deploy Sequence

- [ ] BitMove berhasil deploy → URL dicatat
- [ ] MyKanz berhasil deploy → URL dicatat  
- [ ] Hub env diupdate dengan URL BitMove dan MyKanz yang benar
- [ ] Hub berhasil deploy

### Verifikasi Post-Deploy

- [ ] Dapat register akun baru
- [ ] Dapat login dan dapat access token
- [ ] `/finance/dashboard` via Hub me-rewrite ke MyKanz dengan benar
- [ ] `/quests` via Hub me-rewrite ke BitMove dengan benar
- [ ] Logout berfungsi di semua app
- [ ] Tidak ada error di Vercel Function logs

---

## Referensi Cepat — Semua Credential & URL

### Database URLs (Production-Ready dengan Pooling)

```bash
# AUTH DB — Supabase ap-southeast-1 (project: voxbajabuinyybxlldqo)
AUTH_DATABASE_URL="postgresql://postgres.voxbajabuinyybxlldqo:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

# MYKANZ DB — Supabase ap-southeast-1 (project: dnheeegbbujbrsoawpnu)
MYKANZ_DATABASE_URL="postgresql://postgres.dnheeegbbujbrsoawpnu:M3l3duk210409@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

# BITMOVE DB — Supabase ap-northeast-1 (project: vywkwfmgxzhbbwiuybbx)
BITMOVE_DATABASE_URL="postgresql://postgres.vywkwfmgxzhbbwiuybbx:M3l3duk210409@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

### JWT Secrets (GANTI dengan yang sudah digenerate, NILAI IDENTIK di semua app!)

```bash
JWT_SECRET="[generate dengan: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"]"
JWT_REFRESH_SECRET="[generate lagi dengan command yang sama untuk nilai berbeda]"
```

### Perkiraan URL Vercel Setelah Deploy

```bash
# Hub (app utama) — project name: superapps
NEXT_PUBLIC_APP_URL="https://superapps.vercel.app"

# MyKanz (dipakai sebagai MYKANZ_URL di Hub) — project name: superapps-mykanz
MYKANZ_URL="https://superapps-mykanz.vercel.app"

# BitMove (dipakai sebagai BITMOVE_URL di Hub) — project name: superapps-bitmove
BITMOVE_URL="https://superapps-bitmove.vercel.app"
```

---

*Dibuat: April 2026 | Monorepo: Turborepo + pnpm | Stack: Next.js 16 + Drizzle ORM + Supabase PostgreSQL*
