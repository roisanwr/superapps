# 🌐 SUPERPLANNING — Ekosistem Personal Web Platform
**roisanwr.me** · Portfolio Hub · MyKanz · BitMove

> **Visi Besar:** Satu domain utama yang menjadi *digital identity*-mu — di mana orang bisa melihat siapa kamu (Portfolio), mengelola keuangan (MyKanz), dan memantau perjalanan fitness RPG-mu (BitMove) — semua tanpa login ulang.

---

## 📐 ARSITEKTUR BESAR: Satu Domain, Tiga Wajah

```
roisanwr.me/           → Portfolio (Landing, About, Projects, Blog, Contact)
roisanwr.me/finance/*  → MyKanz (Manajemen Keuangan)
roisanwr.me/quests/*   → BitMove (Fitness Gamification RPG)
```

### Kenapa ini keren secara teknis?
- **Next.js Multi-Zones**: Tiga Next.js app berjalan terpisah, tapi dikonfigurasi seolah satu aplikasi.
- **Turborepo Monorepo**: Semua app dan shared package dalam satu repository → satu `git push`.
- **Supabase SSO**: Login sekali di Portfolio Hub, langsung otentikasi ke Finance & Quests.
- **Kesan Portofolio**: Arsitektur level senior — Monorepo + Multi-Zones + SSO adalah *talking point* wawancara kerja yang sangat kuat.

---

## 📦 STRUKTUR MONOREPO TARGET

```
roisanwr-platform/          ← Root Turborepo
├── apps/
│   ├── hub/                ← Portfolio + Dashboard Hub (domain utama)
│   ├── mykanz/             ← MyKanz (route: /finance/*)
│   └── bitmove/            ← BitMove (route: /quests/*)
│
├── packages/
│   ├── ui/                 ← Shared Design System (Button, Modal, Input, TopBar)
│   ├── auth/               ← Shared Auth utilities (Supabase client, session helpers)
│   ├── database/           ← Shared Prisma client & schema (opsional, jika merge DB)
│   └── config/             ← Shared tsconfig, ESLint, Tailwind base config
│
├── turbo.json
├── package.json            ← Root workspace
└── pnpm-workspace.yaml
```

---

## 🗺️ PETA JALAN LENGKAP (7 FASE)

---

### FASE 0 — Perancangan & Fondasi Konsep *(Minggu 0 — Sebelum Coding)*

> **Tujuan:** Tetapkan keputusan desain besar sebelum satu baris kode ditulis.

#### 0.1 — Keputusan Teknis
- [ ] **Package Manager**: Gunakan `pnpm` (lebih cepat, lebih hemat disk untuk monorepo).
- [ ] **App Router**: Pastikan semua app Next.js menggunakan App Router (bukan Pages Router).
- [ ] **Database Strategy**: Tentukan apakah DB MyKanz dan BitMove **tetap terpisah** atau **digabung** ke satu Supabase project.
  - 💡 **Rekomendasi**: Pisahkan schema (dua schema PostgreSQL berbeda: `finance` dan `quests`) tapi **satu Supabase project**. Ini menghemat biaya dan mempermudah SSO.
- [ ] **Auth Strategy**: Gunakan **Supabase Auth** sebagai satu-satunya sumber kebenaran untuk identitas user.
- [ ] **Domain Plan**: Daftarkan/konfigurasikan `roisanwr.me` (atau domain pilihanmu).

#### 0.2 — Analisis Kode Existing

**MyKanz (Status Saat Ini):**
- Stack: Next.js 16, Prisma 7, PostgreSQL, NextAuth v5
- Auth: Manual (`password_hash` di tabel `users`)
- DB Entities: `users`, `wallets`, `categories`, `fiat_transactions`, `asset_transactions`, `assets`, `budgets`, `goals`
- **Pekerjaan Migrasi:** Ganti `users.password_hash` → link ke `auth.users` Supabase

**BitMove (Status Saat Ini):**
- Stack: Next.js 16, Prisma 7, PostgreSQL, NextAuth v5, sudah ada `@supabase/supabase-js`
- Auth: Manual (`profiles.password_hash`)
- DB Entities: `profiles`, `tasks`, `workouts`, `point_logs`, `rewards`, `level_rules`, dst.
- **Pekerjaan Migrasi:** Hapus `profiles.password_hash` → link ke `auth.users` Supabase

#### 0.3 — Desain Visual Kasar
- [ ] Buat wireframe/moodboard untuk:
  - Landing Page Portfolio (hero section, projects showcase, about me)
  - Dashboard Hub (post-login: widget ringkasan finance + quest)
  - Tema transisi antara Finance Mode ↔ Quest Mode

---

### FASE 1 — Setup Monorepo & Migrasi Kode *(Minggu 1)*

> **Tujuan:** Pindahkan semua kode ke dalam satu rumah Turborepo.

#### 1.1 — Inisialisasi Monorepo
```bash
mkdir roisanwr-platform && cd roisanwr-platform
pnpm dlx create-turbo@latest .
# Pilih: pnpm, hapus semua contoh app bawaan Turbo
```

#### 1.2 — Struktur Awal
```bash
mkdir -p apps/hub apps/mykanz apps/bitmove
mkdir -p packages/ui packages/auth packages/config
```

#### 1.3 — Migrasi App
- [ ] Salin isi `/Projects/mykanz` → `apps/mykanz` (exclude `.git`, `node_modules`, `.next`)
- [ ] Salin isi `/Projects/bitmove` → `apps/bitmove` (exclude `.git`, `node_modules`, `.next`)
- [ ] Update `package.json` masing-masing app:
  - Ubah `name` menjadi `@superapp/mykanz` dan `@superapp/bitmove`
  - Tambahkan reference ke `@superapp/ui` dan `@superapp/auth`

#### 1.4 — Buat Package `@superapp/config`
Berisi:
- `tsconfig.base.json` (shared TypeScript config)
- `eslint.config.base.mjs` (shared ESLint rules)
- `tailwind.base.ts` (shared Tailwind base config, masing-masing app extend ini)

#### 1.5 — Buat Package `@superapp/ui`
Ekstrak komponen UI yang **identik** di kedua app:
- `Button`
- `Input` / `TextArea`
- `Modal` / `ConfirmModal`
- `TopBar` / `BottomNav` (template dasar tanpa tema)
- `Badge` / `Tag`
- `Card` (container generic)
- `Spinner` / `LoadingState`

> **Catatan:** Komponen di `@superapp/ui` harus **tema-agnostic** (gunakan CSS variables), biarkan tiap app yang me-override variabelnya.

```bash
# Struktur packages/ui
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   └── index.ts       ← export semua komponen
├── package.json       ← { "name": "@superapp/ui" }
└── tsconfig.json
```

#### 1.6 — Verifikasi Build
```bash
pnpm install
pnpm turbo build
```
Pastikan semua app bisa di-build dari root monorepo.

---

### FASE 2 — Sentralisasi Auth dengan Supabase *(Minggu 2)*

> **Tujuan:** Single Sign-On — login sekali, akses semua.

#### 2.1 — Setup Supabase Project
- [ ] Buat project baru di [supabase.com](https://supabase.com)
- [ ] Aktifkan **Email/Password Auth** (minimal), tambahkan Google OAuth sebagai bonus
- [ ] Catat: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

#### 2.2 — Desain Ulang Schema Database

**Strategi:** Gunakan dua PostgreSQL Schema terpisah dalam satu Supabase project.

```sql
-- Schema 1: finance (untuk MyKanz)
-- Schema 2: quests (untuk BitMove)
-- Schema auth: milik Supabase (jangan disentuh manual)
```

**Migration MyKanz:**
```sql
-- Hapus password_hash dari users
-- Tambah foreign key ke auth.users
ALTER TABLE finance.users
  DROP COLUMN password_hash,
  ADD CONSTRAINT fk_supabase_user
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

**Migration BitMove:**
```sql
-- Hapus password_hash dari profiles
-- Ganti id agar sinkron dengan auth.users
ALTER TABLE quests.profiles
  DROP COLUMN password_hash,
  ADD CONSTRAINT fk_supabase_user
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### 2.3 — Buat Package `@superapp/auth`

```typescript
// packages/auth/src/server.ts
import { createServerClient } from '@supabase/ssr'

// packages/auth/src/client.ts
import { createBrowserClient } from '@supabase/ssr'
```

Package ini berisi:
- `createServerClient()` helper untuk Server Components
- `createBrowserClient()` helper untuk Client Components
- `getSession()` utility
- `middleware` helper untuk route protection

#### 2.4 — Implementasi Login Terpusat
- [ ] Login/Register page ada di `apps/hub` (`/login`, `/register`)
- [ ] Setelah login di Hub, cookie Supabase session di-set untuk seluruh domain (`.roisanwr.me`)
- [ ] App `mykanz` dan `bitmove` membaca session dari cookie — **tidak ada form login sendiri**
- [ ] Buat `middleware.ts` di setiap app yang redirect ke `roisanwr.me/login` jika tidak ada session

#### 2.5 — Migrasi Data
- [ ] Buat `scripts/migrate-users.ts` di root monorepo
- [ ] Script ini: baca data user dari DB lama → buat user di Supabase Auth → update ID di tabel finance/quests

---

### FASE 3 — Bangun `apps/hub` (Portfolio + Dashboard) *(Minggu 3)*

> **Tujuan:** Ini adalah wajah utama dari seluruh ekosistem.

#### 3.1 — Halaman Portfolio (Public — Sebelum Login)

##### Route: `/` — Landing Page
```
Hero Section:
  - Nama & Tagline (animasi typing/reveal)
  - Dua CTA: "Lihat Proyek" & "Hubungi Saya"
  - Background: Subtle animated gradient atau particle effect

About Section:
  - Foto + Bio singkat
  - Tech stack badges (Next.js, TypeScript, PostgreSQL, dll)

Projects Section:
  - Card untuk MyKanz (Finance App)
  - Card untuk BitMove (RPG Fitness)
  - Card untuk proyek lain (internship-scraper, dll)
  - Setiap card: screenshot/mockup, stack, link ke live demo & GitHub

Skills/Experience Section:
  - Timeline pendidikan & pengalaman
  - Skill bars atau tag cloud

Contact Section:
  - Form kontak
  - Link: GitHub, LinkedIn, Email
```

##### Route: `/projects/[slug]` — Detail Proyek
- Case study lebih dalam untuk tiap proyek
- Screenshot, arsitektur, tantangan yang dihadapi

##### Route: `/blog` (Opsional — Fase Bonus)
- Tulis proses membangun Super App ini → konten portofolio *sambil membangun*

#### 3.2 — Dashboard Hub (Private — Setelah Login)

##### Route: `/dashboard` — Command Center
```
┌────────────────────────────────────────────────────┐
│  👋 Selamat Datang, Roisan                         │
│  11 April 2026 · Winstreak: 🔥 7 hari             │
├──────────────────────┬─────────────────────────────┤
│  💰 FINANCE (MyKanz) │  ⚔️ QUESTS (BitMove)        │
│  Total Aset: Rp X    │  Level 12 · XP: 2400/3000   │
│  Pengeluaran bulan   │  Quest hari ini: 3/5 selesai │
│  ini: Rp Y           │  Winstreak: 7 hari berturut  │
│  [Buka Finance →]    │  [Buka Quests →]             │
├──────────────────────┴─────────────────────────────┤
│  📊 GRAFIK 7 HARI TERAKHIR                         │
│  [Pengeluaran] [XP Earned] - toggle antara keduanya│
└────────────────────────────────────────────────────┘
```

Widget data diambil secara paralel dari kedua API:
```typescript
// Dashboard fetches data dari kedua service secara parallel
const [financeData, questData] = await Promise.all([
  fetch('/finance/api/summary'),
  fetch('/quests/api/summary'),
])
```

#### 3.3 — Konfigurasi Multi-Zones (Next.js Rewrites)

```typescript
// apps/hub/next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/finance/:path*',
        destination: `${process.env.MYKANZ_URL}/finance/:path*`,
      },
      {
        source: '/quests/:path*',
        destination: `${process.env.BITMOVE_URL}/quests/:path*`,
      },
    ]
  },
}
```

```typescript
// apps/mykanz/next.config.ts
const nextConfig = {
  basePath: '/finance',  // ← Semua route mykanz jadi /finance/...
}

// apps/bitmove/next.config.ts
const nextConfig = {
  basePath: '/quests',   // ← Semua route bitmove jadi /quests/...
}
```

---

### FASE 4 — Penyatuan UI/UX "Beda Rasa, Satu DNA" *(Minggu 4)*

> **Tujuan:** User merasakan perpindahan "mode", bukan perpindahan aplikasi.

#### 4.1 — Design System via CSS Variables

Package `@superapp/ui` mendefinisikan *interface* variabel CSS:
```css
/* packages/ui/src/tokens.css */
:root {
  --color-primary: ;        /* Tiap app mengisi ini */
  --color-primary-hover: ;
  --color-surface: ;
  --color-surface-alt: ;
  --color-text: ;
  --color-text-muted: ;
  --color-border: ;
  --radius-base: ;
  --font-sans: ;
}
```

**MyKanz Theme** (Elegan, Profesional):
```css
/* apps/mykanz/app/globals.css */
:root {
  --color-primary: oklch(65% 0.15 160);   /* Emerald */
  --color-surface: oklch(98% 0.01 240);   /* Off-white */
  --color-text: oklch(20% 0.02 240);      /* Deep slate */
  --font-sans: 'Inter', sans-serif;
}
```

**BitMove Theme** (Gaming, Dark, Neon):
```css
/* apps/bitmove/app/globals.css */
:root {
  --color-primary: oklch(65% 0.2 230);    /* Neon Blue */
  --color-surface: oklch(12% 0.02 240);   /* Near-black */
  --color-text: oklch(95% 0.01 240);      /* Near-white */
  --font-sans: 'Rajdhani', sans-serif;    /* Gaming font */
}
```

#### 4.2 — Animasi Transisi Mode (Context Switch)

Saat navigasi antara `/finance/*` dan `/quests/*`, tampilkan animasi transisi:
```typescript
// Opsi A: Framer Motion Page Transition
// Wrapped di layout Hub: fade + slide + color shift

// Opsi B: CSS View Transitions API (native, no library)
document.startViewTransition(() => {
  router.push('/quests')
})
```

Animasi yang direkomendasikan:
- **Finance → Quests**: Efek "memasuki dungeon" — layar gelap memudar, accent color bergeser dari emerald ke neon blue
- **Quests → Finance**: Efek "kembali ke dunia nyata" — inverse dari atas

#### 4.3 — Persistent Bottom Navigation (Mobile)

Di layar mobile (`< 768px`), ganti sidebar dengan Bottom Nav yang *persisten* di semua mode:
```
┌────────────────────────────┐
│                            │
│       [Content Area]       │
│                            │
├────────────────────────────┤
│ 🏠 Hub │ 💰 Finance │ ⚔️ Quests │
└────────────────────────────┘
```

Bottom Nav ada di `apps/hub` dan di-inject melalui layout (atau gunakan Multi-Zone iframe trick).

---

### FASE 5 — Progressive Web App (PWA) *(Minggu 5)*

> **Tujuan:** Terasa seperti native app saat di-install di HP.

#### 5.1 — Audit Responsivitas
- [ ] Semua tabel (transaksi, log workout) harus ada versi card/list untuk mobile
- [ ] Touch target minimum 44x44px
- [ ] Pastikan tidak ada horizontal scroll di mobile

#### 5.2 — Implementasi PWA
```bash
cd apps/hub
pnpm add next-pwa
```

```typescript
// apps/hub/next.config.ts
import withPWA from 'next-pwa'

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})
```

**`apps/hub/public/manifest.json`:**
```json
{
  "name": "roisanwr platform",
  "short_name": "roisanwr",
  "description": "Portfolio, Finance & Fitness — All in One",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### 5.3 — Service Worker Caching Strategy
- **Dashboard Hub**: Cache-first (boleh lihat data lama saat offline)
- **Finance data**: Network-first (data keuangan harus selalu fresh)
- **Quests data**: Stale-while-revalidate (tampilkan cache, update di background)

---

### FASE 6 — Deployment Production *(Minggu 6)*

> **Tujuan:** Go live di Vercel dengan custom domain.

#### 6.1 — Setup Vercel Monorepo (3 Project Terpisah)

Di Vercel, deploy 3 proyek berbeda dari satu repository:

| Vercel Project | Root Directory | Domain |
|----------------|---------------|--------|
| `superapp-hub` | `apps/hub` | `roisanwr.me` |
| `superapp-mykanz` | `apps/mykanz` | `finance.roisanwr.me` (internal) |
| `superapp-bitmove` | `apps/bitmove` | `quests.roisanwr.me` (internal) |

`apps/mykanz` dan `apps/bitmove` **tidak perlu custom domain publik** — mereka diakses melalui rewrites dari Hub.

#### 6.2 — Environment Variables

**`apps/hub` (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MYKANZ_URL=https://finance-internal.roisanwr.me
BITMOVE_URL=https://quests-internal.roisanwr.me
```

**`apps/mykanz` (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://...?schema=finance
```

**`apps/bitmove` (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://...?schema=quests
```

#### 6.3 — `turbo.json` untuk Build Pipeline
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

#### 6.4 — Domain & Go Live
- [ ] Setup custom domain di Vercel untuk `apps/hub`
- [ ] Konfigurasi DNS: `roisanwr.me` → Vercel Hub
- [ ] Test end-to-end: Landing → Login → Dashboard → Finance → Quests
- [ ] Setup Vercel Analytics untuk monitoring

---

### FASE 7 (BONUS) — Fitur Cross-App *(Pasca Launch)*

> Fitur-fitur ini memperkuat konsep "Super App" dan membuat ekosistem terasa lebih terintegrasi.

#### 7.1 — Reward Finance dari Quest Achievement
- Selesaikan misi tertentu di BitMove → unlock "cashback kategori" di MyKanz
- Implementasi: Supabase Edge Function yang mendengarkan event dari BitMove → trigger update di MyKanz

#### 7.2 — XP Reward dari Tabungan Target
- Capai target saving di MyKanz → dapat XP bonus di BitMove
- Implementasi: Webhook atau Supabase database trigger antar schema

#### 7.3 — Unified Notification System
- Satu notifikasi center di Dashboard Hub
- "Kamu mendekati batas budget!" (dari MyKanz)
- "Kamu belum workout hari ini!" (dari BitMove)
- Implementasi: Push Notifications via PWA + Service Worker

#### 7.4 — Profile Page Publik
Route: `roisanwr.me/u/roisan` — halaman publik yang menampilkan:
- Level & XP BitMove (gamified profile card)
- Total aset yang dimiliki (privacy-filtered, bukan nominal asli)
- Winstreak & achievement badges
- **Fungsi**: Flex untuk network, sekaligus portofolio "living proof"

---

## ⚠️ KEPUTUSAN PENTING YANG PERLU DIDISKUSIKAN

### 1. Database: Merge atau Pisah?

| Opsi | Pro | Kontra |
|------|-----|--------|
| **Satu Supabase Project, dua Schema** (Rekomendasi) | SSO mudah, satu billing, data bisa cross-query | Migrasi lebih kompleks |
| **Dua Supabase Project** | Lebih terisolasi, mudah dikelola | SSO lebih rumit, dua billing |

### 2. Portfolio: Bagian dari Hub App atau Terpisah?

| Opsi | Pro | Kontra |
|------|-----|--------|
| **Portfolio di dalam `apps/hub`** (Rekomendasi) | Satu domain, satu deployment | Coupling antara portofolio & dashboard |
| **Portfolio sebagai `apps/portfolio`** | Separation of concerns | Butuh rewrite ekstra |

**Rekomendasi**: Letakkan di `apps/hub`. Route `/` sampai `/projects` adalah public portfolio, route `/dashboard` ke atas butuh auth.

### 3. Apakah BitMove & MyKanz Bisa Diakses Langsung dari Internet?

**Rekomendasi**: Tidak. Hanya Hub yang punya custom domain publik. MyKanz dan BitMove dideploy sebagai "internal services" yang hanya bisa diakses melalui Hub rewrites. Ini lebih aman dan membuat UX lebih seamless.

### 4. Apakah Cross-App Features (Fase 7) Masuk Scope MVP?

Saran: Tidak. Fokus ke SSO dan multi-zones dulu. Cross-app features bisa jadi "v2".

---

## 📅 TIMELINE REALISTIS (Revisi)

| Minggu | Fase | Deliverable |
|--------|------|-------------|
| **0** | Perancangan | Wireframe portfolio, keputusan DB & auth strategy |
| **1** | Monorepo Setup | Turborepo jalan, kedua app bisa di-build dari root |
| **2** | Supabase Auth | Login/Register terpusat jalan, session tersebar ke semua app |
| **3** | Hub App | Portfolio publik jalan + Dashboard Hub dengan widget |
| **4** | UI/UX Unification | Tema konsisten, animasi transisi, mobile nav |
| **5** | PWA | Install prompt jalan di Android & iOS |
| **6** | Production Deploy | Live di `roisanwr.me` dengan custom domain |
| **7+** | Iterasi | Cross-app features, blog, public profile |

---

## 🏗️ KEPUTUSAN STACK FINAL

| Concern | Teknologi | Alasan |
|---------|-----------|--------|
| Monorepo | Turborepo + pnpm | Cepat, caching build, standar industri |
| Framework | Next.js 16+ (App Router) | SSR, multi-zones, sudah dipakai di kedua app |
| Auth | Supabase Auth + `@supabase/ssr` | SSO across domains, gratis tier cukup |
| Database | PostgreSQL via Supabase + Prisma | Sudah dipakai, familiar, type-safe |
| Styling | Tailwind CSS v4 + CSS Variables | Theming per-app, sudah dipakai |
| Animasi | Framer Motion atau CSS View Transitions | Transisi antar mode |
| PWA | next-pwa | Mudah diintegrasikan dengan Next.js |
| Deploy | Vercel | Zero-config untuk Next.js, free tier |
| Analytics | Vercel Analytics | Sudah bundled dengan Vercel |

---

## 🚀 LANGKAH PERTAMA YANG BISA DILAKUKAN SEKARANG

Jangan langsung coding. Lakukan ini dulu:

1. **Buat akun Supabase** dan setup project baru (gratis).
2. **Buat repository baru** di GitHub/GitLab: `roisanwr-platform` (atau nama pilihanmu).
3. **Buat wireframe kasar** untuk Portfolio Landing Page (bisa pakai Figma, Excalidraw, atau kertas).
4. **Diskusikan keputusan di bagian "⚠️ Keputusan Penting"** sebelum mulai coding.

---

## 📝 CATATAN PORTOFOLIO

Dokumentasikan proses ini sejak sekarang:
- Tulis `ARCHITECTURE.md` di root monorepo
- Update README tiap fase selesai
- Screenshot before/after migration
- Catat "lessons learned" tiap minggu

**Ini adalah bukti nyata kemampuan engineering-mu.** Arsitektur Monorepo + Multi-Zones + SSO + PWA adalah level yang bahkan banyak developer senior belum pernah implement secara penuh.

---

*Dibuat: 8 April 2026 · Platform: roisanwr.me*
