# 🌐 SUPERPLANNING — Ekosistem Personal Web Platform
**roisanwr.me** · Portfolio Hub · MyKanz · BitMove

> **Visi Besar:** Satu domain utama yang menjadi *digital identity*-mu — di mana orang bisa melihat siapa kamu (Portfolio), mengelola keuangan (MyKanz), dan memantau perjalanan fitness RPG-mu (BitMove) — semua tanpa login ulang.

---

## 📐 ARSITEKTUR BESAR: Satu Domain, Tiga Wajah

```
roisanwr.me/           → Hub (Landing, About, Projects, Blog, Contact, Dashboard)
roisanwr.me/finance/*  → MyKanz (Manajemen Keuangan)
roisanwr.me/quests/*   → BitMove (Fitness Gamification RPG)
```

### Kenapa ini keren secara teknis?
- **Next.js Multi-Zones**: Tiga Next.js app berjalan terpisah, tapi dikonfigurasi seolah satu aplikasi.
- **Turborepo Monorepo**: Semua app dan shared package dalam satu repository → satu `git push`.
- **Custom JWT Auth**: Auth mandiri di database sendiri — tidak perlu Supabase Auth, tidak perlu NextAuth — full kontrol.
- **Drizzle ORM**: Type-safe, ringan, tanpa "client generation" seperti Prisma — langsung query dari schema TypeScript.
- **Kesan Portofolio**: Arsitektur level senior — Monorepo + Multi-Zones + Custom Auth + Multi-DB adalah *talking point* wawancara yang sangat kuat.

---

## 🗄️ ARSITEKTUR DATABASE BARU (DRIZZLE — 3 DATABASE TERPISAH)

> **Keputusan Final:** Tiga database PostgreSQL terpisah. Tidak ada cross-DB FK. Komunikasi antar DB hanya melalui `userId` UUID yang dikirim via JWT.

```
┌─────────────────────────────────────────────────┐
│              DATABASE LAYOUT                     │
├─────────────────┬───────────────┬───────────────┤
│  authdb         │  mykanzdb     │  bitmovedb    │
│  @woilaa/db-auth│  @woilaa/db-  │  @woilaa/db-  │
│                 │  mykanz       │  bitmove      │
├─────────────────┼───────────────┼───────────────┤
│ users           │ wallets       │ profiles      │
│ sessions        │ categories    │ level_rules   │
│ app_access      │ fiat_transact │ tier_rewards  │
│                 │ ions          │ point_logs    │
│                 │ budgets       │ task_library  │
│                 │ budget_categ  │ tasks         │
│                 │ ories         │ workouts      │
│                 │ budget_wallet │ exercise_lib  │
│                 │ s             │ difficulty_sc │
│                 │ goals         │ ales          │
│                 │ assets        │ workout_exerc │
│                 │ user_portfoli │ ises          │
│                 │ os            │ sets          │
│                 │ asset_transac │ training_prog │
│                 │ tions         │ rams          │
│                 │ asset_valuat  │ program_sched │
│                 │ ions          │ ules          │
│                 │               │ rewards       │
└─────────────────┴───────────────┴───────────────┘

Cross-DB link: userId UUID dikirim via JWT → tidak ada FK constraint lintas DB
```

### Paket Database di Monorepo

```
packages/
├── db-auth/        → @woilaa/db-auth    (authdb)
├── db-mykanz/      → @woilaa/db-mykanz  (mykanzdb)
└── db-bitmove/     → @woilaa/db-bitmove (bitmovedb)
```

Setiap paket sudah ada di folder `databaseNEW/` dan akan dipindahkan ke `packages/`.

---

## 📦 STRUKTUR MONOREPO TARGET

```
superapps/                   ← Root Turborepo (sudah ada)
├── apps/
│   ├── hub/                 ← Portfolio + Dashboard Hub (domain utama) [BELUM ADA]
│   ├── mykanz/              ← MyKanz (route: /finance/*)  [SUDAH ADA - perlu migrasi]
│   └── bitmove/             ← BitMove (route: /quests/*) [SUDAH ADA - perlu migrasi]
│
├── packages/
│   ├── ui/                  ← Shared Design System [SUDAH ADA - perlu dilengkapi]
│   ├── config/              ← Shared tsconfig, ESLint, Tailwind [SUDAH ADA]
│   ├── db-auth/             ← @woilaa/db-auth (Drizzle schema + queries auth) [BARU - dari databaseNEW/authdb]
│   ├── db-mykanz/           ← @woilaa/db-mykanz (Drizzle schema + queries finance) [BARU - dari databaseNEW/mykanzdb]
│   └── db-bitmove/          ← @woilaa/db-bitmove (Drizzle schema + queries quests) [BARU - dari databaseNEW/db-bitmove]
│
├── turbo.json               [SUDAH ADA]
├── package.json             [SUDAH ADA]
└── pnpm-workspace.yaml      [SUDAH ADA]
```

---

## 🗺️ PETA JALAN LENGKAP (7 FASE)

---

### FASE 0 — Status Saat Ini & Keputusan Final *(SELESAI)*

#### ✅ Keputusan Teknis yang Sudah Ditetapkan

| Keputusan | Pilihan Final |
|-----------|---------------|
| Package Manager | `pnpm` + Turborepo ✅ |
| Framework | Next.js 16+ App Router ✅ |
| ORM | **Drizzle ORM** (migrasi dari Prisma) 🔄 |
| Auth Strategy | **Custom JWT** — bukan Supabase Auth, bukan NextAuth 🔄 |
| Database | PostgreSQL via Supabase (3 database terpisah) |
| Auth DB | `authdb` — users, sessions, app_access |
| Finance DB | `mykanzdb` — wallets, categories, dst. |
| Quests DB | `bitmovedb` — profiles, tasks, workouts, dst. |
| Styling | Tailwind CSS v4 + CSS Variables |
| Deploy | Vercel (3 project dari 1 repo) |

#### Status App Saat Ini

**MyKanz:**
- Stack: Next.js 16, **Prisma 7**, PostgreSQL, NextAuth v5 ← **PERLU MIGRASI**
- Auth: Manual password_hash di tabel users (via Prisma + NextAuth + bcrypt)
- DB terhubung ke Supabase via direct URL + pooler URL
- Sudah ada di `apps/mykanz/` dalam monorepo

**BitMove:**
- Stack: Next.js 16, **Prisma 7**, PostgreSQL, NextAuth v5 ← **PERLU MIGRASI**
- Auth: Manual password_hash di profiles
- Sudah ada di `apps/bitmove/` dalam monorepo

**Database Baru (databaseNEW/):**
- ✅ `authdb/` — Drizzle schema + queries untuk auth (users, sessions, app_access)
- ✅ `mykanzdb/` — Drizzle schema + queries untuk finance
- ✅ `db-bitmove/` — Drizzle schema + queries untuk quests
- Status: Belum dipindahkan ke `packages/`, belum ada `package.json`, belum ada `client.ts`

---

### FASE 1 — Migrasi Database Package ke Monorepo *(PRIORITAS SEKARANG)*

> **Tujuan:** Pindahkan folder `databaseNEW/` menjadi package resmi monorepo yang bisa di-import apps.

#### 1.1 — Setup Package `@woilaa/db-auth`

Pindahkan `databaseNEW/authdb/` → `packages/db-auth/`

**Struktur target:**
```
packages/db-auth/
├── src/
│   ├── schema/
│   │   └── schema.ts        ← Sudah ada (users, sessions, app_access)
│   ├── queries/
│   │   ├── users.ts         ← Sudah ada
│   │   ├── sessions.ts      ← Sudah ada
│   │   └── appAccess.ts     ← Sudah ada
│   ├── client.ts            ← PERLU DIBUAT (Drizzle db instance untuk authdb)
│   └── index.ts             ← Sudah ada (barrel export)
├── package.json             ← PERLU DIBUAT
├── tsconfig.json            ← PERLU DIBUAT
└── drizzle.config.ts        ← PERLU DIBUAT
```

**`packages/db-auth/package.json`:**
```json
{
  "name": "@woilaa/db-auth",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.40.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "typescript": "^5"
  }
}
```

**`packages/db-auth/src/client.ts`:**
```typescript
// packages/db-auth/src/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const connectionString = process.env.AUTH_DATABASE_URL!;

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
```

**`packages/db-auth/drizzle.config.ts`:**
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL!,
  },
});
```

---

#### 1.2 — Setup Package `@woilaa/db-mykanz`

Pindahkan `databaseNEW/mykanzdb/` → `packages/db-mykanz/`

**Struktur target:**
```
packages/db-mykanz/
├── src/
│   ├── schema/
│   │   └── schema.ts        ← Sudah ada (wallets, categories, fiat_transactions, dst.)
│   ├── queries/
│   │   ├── wallets.ts       ← Sudah ada
│   │   ├── categories.ts    ← Sudah ada
│   │   ├── transactions.ts  ← Sudah ada
│   │   ├── budgets.ts       ← Sudah ada
│   │   ├── assets.ts        ← Sudah ada
│   │   ├── goals.ts         ← Sudah ada
│   │   └── portfolios.ts    ← Sudah ada
│   ├── client.ts            ← PERLU DIBUAT
│   └── index.ts             ← Sudah ada (barrel export lengkap)
├── package.json             ← PERLU DIBUAT
├── tsconfig.json            ← PERLU DIBUAT
└── drizzle.config.ts        ← PERLU DIBUAT
```

**Schema Summary (`@woilaa/db-mykanz`):**
| Table | Deskripsi |
|-------|-----------|
| `wallets` | Dompet user (TUNAI, BANK, DOMPET_DIGITAL) |
| `categories` | Kategori transaksi (global seed + custom user) |
| `fiat_transactions` | Transaksi uang (PEMASUKAN, PENGELUARAN, TRANSFER) |
| `budgets` | Budget dengan periode |
| `budget_categories` | Junction: budget ↔ kategori (hybrid) |
| `budget_wallets` | Junction: budget ↔ wallet (hybrid) |
| `goals` | Target tabungan/aset |
| `assets` | Master aset (global + custom user — KRIPTO, SAHAM, LOGAM, dll) |
| `user_portfolios` | Kepemilikan aset user (DCA tracking) |
| `asset_transactions` | Transaksi aset (BELI, JUAL, SALDO_AWAL) |
| `asset_valuations` | History harga aset (API + MANUAL) |

**Catatan cross-DB:** `userId` di semua tabel adalah UUID polos (tidak ada FK) — nilainya berasal dari JWT payload yang diverifikasi di app layer.

**`packages/db-mykanz/src/client.ts`:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const connectionString = process.env.MYKANZ_DATABASE_URL!;

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
```

---

#### 1.3 — Setup Package `@woilaa/db-bitmove`

Pindahkan `databaseNEW/db-bitmove/` → `packages/db-bitmove/`

**Struktur target:**
```
packages/db-bitmove/
├── src/
│   ├── schema/
│   │   └── schema.ts        ← Sudah ada (profiles, tasks, workouts, dst.)
│   ├── queries/
│   │   ├── profiles.ts      ← Sudah ada
│   │   ├── tasks.ts         ← Sudah ada
│   │   ├── workouts.ts      ← Sudah ada
│   │   ├── programs.ts      ← Sudah ada
│   │   ├── rewards.ts       ← Sudah ada
│   │   └── gamification.ts  ← Sudah ada
│   ├── client.ts            ← PERLU DIBUAT
│   └── index.ts             ← Sudah ada (barrel export)
├── package.json             ← PERLU DIBUAT
├── tsconfig.json            ← PERLU DIBUAT
└── drizzle.config.ts        ← PERLU DIBUAT
```

**Schema Summary (`@woilaa/db-bitmove`):**
| Table | Deskripsi |
|-------|-----------|
| `profiles` | Gamification stats (XP, level, streak, tier) |
| `level_rules` | Lookup XP threshold per level (seed 1–50) |
| `tier_rewards` | Reward XP/points per tier (D, C, B, A, S, SS) |
| `point_logs` | Ledger immutable semua perubahan XP/points |
| `task_library` | Template task bawaan sistem |
| `tasks` | Task milik user (clone dari library) |
| `workouts` | Sesi workout (IN_PROGRESS / COMPLETED) |
| `exercise_library` | 51 exercise bawaan + custom user |
| `difficulty_scales` | Threshold tier per scale_type |
| `workout_exercises` | Junction: workout ↔ exercise |
| `sets` | Set per exercise dengan tier dan value |
| `training_programs` | Program latihan user (support rotation) |
| `program_schedules` | Template schedule per hari per minggu |
| `rewards` | Reward custom user (redeem via points) |

**Catatan cross-DB:** `profiles.userId` adalah UUID yang sama dengan `authdb.users.id` — dikirim via JWT, **bukan FK constraint**.

**`packages/db-bitmove/src/client.ts`:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const connectionString = process.env.BITMOVE_DATABASE_URL!;

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
```

---

#### 1.4 — Update `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

> Sudah include `packages/*` — tidak perlu ubah. Cukup pastikan folder `packages/db-auth`, `packages/db-mykanz`, `packages/db-bitmove` ada.

#### 1.5 — Update `turbo.json` untuk DB packages

Tambahkan task `db:generate` dan `db:migrate`:

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
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

### FASE 2 — Migrasi Auth: Prisma + NextAuth → Custom JWT *(INTI PERUBAHAN)*

> **Tujuan:** Ganti seluruh sistem auth di `apps/mykanz` dan `apps/bitmove` dari Prisma + NextAuth ke Custom JWT menggunakan `@woilaa/db-auth`.

#### 2.1 — Desain Sistem Auth Baru

**Flow Register:**
```
User input email/password
  → Hash password (bcrypt)
  → INSERT ke authdb.users
  → INSERT ke authdb.app_access (mykanz + bitmove auto-granted)
  → Return access token (JWT short-lived) + refresh token (UUID, disimpan di authdb.sessions)
```

**Flow Login:**
```
User input email/password
  → SELECT dari authdb.users WHERE email = ?
  → bcrypt.compare(password, passwordHash)
  → Generate access token (JWT, 15 menit, signed dengan JWT_SECRET)
  → Generate refresh token (UUID v4, 7 hari, INSERT ke authdb.sessions)
  → Set HTTP-only cookie: access_token + refresh_token
```

**JWT Payload:**
```typescript
type JWTPayload = {
  sub: string;       // user.id (UUID)
  email: string;
  username: string;
  name: string;
  role: "user" | "admin";
  apps: ("mykanz" | "bitmove")[];  // dari app_access
  iat: number;
  exp: number;
}
```

**Route Protection (Middleware):**
```
Request masuk
  → Baca cookie access_token
  → Verify JWT (jose / jsonwebtoken)
  → Jika valid: inject userId ke request header → lanjut
  → Jika expired: cek refresh_token di DB → issue access_token baru
  → Jika tidak ada / invalid: redirect ke /login
```

#### 2.2 — Hapus Prisma dari MyKanz

**File yang perlu dihapus/diganti:**

| File | Action |
|------|--------|
| `apps/mykanz/lib/prisma.ts` | ❌ Delete |
| `apps/mykanz/lib/auth.ts` | 🔄 Rewrite (hapus NextAuth, pakai custom JWT) |
| `apps/mykanz/lib/auth.config.ts` | ❌ Delete |
| `apps/mykanz/prisma/` | ❌ Delete folder |
| `apps/mykanz/prisma.config.ts` | ❌ Delete |

**Dependencies yang dihapus dari `apps/mykanz/package.json`:**
```json
// HAPUS
"@prisma/adapter-pg": "^7.4.2",
"@prisma/client": "^7.4.2",
"next-auth": "^5.0.0-beta.30",
"prisma": "^7.4.2"  // devDependencies
```

**Dependencies yang ditambahkan:**
```json
// TAMBAH
"@woilaa/db-auth": "workspace:*",
"@woilaa/db-mykanz": "workspace:*",
"jose": "^5.9.0",
"postgres": "^3.4.5"
```

**File baru yang dibuat:**

```
apps/mykanz/lib/
├── db.ts          ← import { db } from "@woilaa/db-mykanz" (re-export)
├── auth-db.ts     ← import { db } from "@woilaa/db-auth" (re-export)
├── jwt.ts         ← helper: signToken, verifyToken, withAuth
└── session.ts     ← helper: getCurrentUser() dari cookie/header
```

**`apps/mykanz/middleware.ts` — Rewrite:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyToken(token);
    const response = NextResponse.next();
    // Inject userId ke header untuk dipakai di Server Components
    response.headers.set("x-user-id", payload.sub);
    return response;
  } catch {
    // Token expired — coba refresh
    return NextResponse.redirect(new URL("/api/auth/refresh", request.url));
  }
}

export const config = {
  matcher: ["/((?!login|register|api/auth|_next/static|_next/image|favicon).*)"],
};
```

**`apps/mykanz/app/api/auth/` — Route Handlers baru:**
```
apps/mykanz/app/api/auth/
├── register/route.ts    ← POST: create user di authdb
├── login/route.ts       ← POST: verify password, set cookie JWT
├── logout/route.ts      ← POST: hapus session dari DB + clear cookie
└── refresh/route.ts     ← GET: gunakan refresh token untuk issue access token baru
```

#### 2.3 — Hapus Prisma dari BitMove

**File yang perlu dihapus/diganti:**

| File | Action |
|------|--------|
| `apps/bitmove/lib/prisma.ts` | ❌ Delete |
| `apps/bitmove/lib/auth.ts` | 🔄 Rewrite |
| `apps/bitmove/prisma/` | ❌ Delete folder |
| `apps/bitmove/prisma.config.ts` | ❌ Delete |

**Dependencies yang dihapus dari `apps/bitmove/package.json`:**
```json
// HAPUS
"@prisma/adapter-pg": "^7.6.0",
"@prisma/client": "^7.6.0",
"@supabase/supabase-js": "^2.100.1",
"next-auth": "^5.0.0-beta.30",
"prisma": "^7.6.0"  // devDependencies
```

**Dependencies yang ditambahkan:**
```json
// TAMBAH
"@woilaa/db-auth": "workspace:*",
"@woilaa/db-bitmove": "workspace:*",
"jose": "^5.9.0",
"postgres": "^3.4.5"
```

**File baru di apps/bitmove:**
```
apps/bitmove/lib/
├── db.ts          ← import { db } from "@woilaa/db-bitmove"
├── auth-db.ts     ← import { db } from "@woilaa/db-auth"
├── jwt.ts         ← copy dari mykanz (atau bisa jadi shared package nanti)
└── session.ts     ← getCurrentUser() dari cookie/header
```

> **Catatan:** Pertimbangkan buat `packages/auth-utils/` di fase lanjutan untuk share jwt.ts dan session.ts antara mykanz dan bitmove — hindari duplikasi.

#### 2.4 — Environment Variables Baru

**`apps/mykanz/.env` (replace yang lama):**
```
# Database
AUTH_DATABASE_URL="postgresql://...authdb connection string..."
MYKANZ_DATABASE_URL="postgresql://...mykanzdb connection string..."

# JWT
JWT_SECRET="minimum-32-karakter-random-string-ganti-ini"
JWT_REFRESH_SECRET="minimum-32-karakter-random-string-berbeda"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**`apps/bitmove/.env` (replace yang lama):**
```
# Database
AUTH_DATABASE_URL="postgresql://...authdb connection string (SAMA dengan mykanz)..."
BITMOVE_DATABASE_URL="postgresql://...bitmovedb connection string..."

# JWT
JWT_SECRET="SAMA dengan di mykanz — harus identik"
JWT_REFRESH_SECRET="SAMA dengan di mykanz"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

> ⚠️ **JWT_SECRET harus identik di semua app!** Karena access_token yang di-issue di mykanz harus bisa di-verify di bitmove dan sebaliknya — inilah yang membuat SSO antar app bisa bekerja.

---

### FASE 3 — Migrasi API Routes: Prisma Query → Drizzle Query *(MyKanz)*

> **Tujuan:** Ganti semua `prisma.xxx.findMany()` dll. dengan query dari `@woilaa/db-mykanz`.

#### 3.1 — Pemetaan Prisma → Drizzle di MyKanz

Setiap API route yang sebelumnya pakai Prisma harus diupdate:

**Contoh perubahan:**
```typescript
// BEFORE (Prisma)
import prisma from "@/lib/prisma";
const wallets = await prisma.wallets.findMany({
  where: { userId: session.user.id, deletedAt: null },
});

// AFTER (Drizzle)
import { getWalletsByUserId } from "@woilaa/db-mykanz";
const wallets = await getWalletsByUserId(userId);
// atau akses langsung:
import { db } from "@/lib/db";
import { wallets } from "@woilaa/db-mykanz";
import { eq, isNull } from "drizzle-orm";
const result = await db
  .select()
  .from(wallets)
  .where(and(eq(wallets.userId, userId), isNull(wallets.deletedAt)));
```

**Cara ambil userId setelah auth dimigrasi:**
```typescript
// Sebelumnya dari NextAuth session
const session = await getServerSession(authOptions);
const userId = session.user.id;

// Setelah migrasi ke custom JWT
import { getCurrentUser } from "@/lib/session";
const user = await getCurrentUser(); // baca dari cookie / header x-user-id
const userId = user.sub;
```

#### 3.2 — Checklist Route API MyKanz yang Perlu Dimigrasi

Cek setiap route di `apps/mykanz/app/api/`:
- [ ] `wallets/` — CRUD wallets
- [ ] `categories/` — CRUD + seed categories
- [ ] `transactions/` — CRUD fiat transactions + transfer
- [ ] `budgets/` — CRUD budgets + progress
- [ ] `goals/` — CRUD goals + progress
- [ ] `assets/` — browse assets + portfolio
- [ ] `dashboard/` — summary data untuk widget

---

### FASE 4 — Migrasi API Routes: Prisma Query → Drizzle Query *(BitMove)*

> **Tujuan:** Ganti semua Prisma query di BitMove dengan query dari `@woilaa/db-bitmove`.

#### 4.1 — Pemetaan Prisma → Drizzle di BitMove

**Contoh perubahan:**
```typescript
// BEFORE (Prisma)
import prisma from "@/lib/prisma";
const profile = await prisma.profiles.findUnique({
  where: { userId: session.user.id }
});

// AFTER (Drizzle)
import { getProfileById } from "@woilaa/db-bitmove";
const profile = await getProfileById(userId);
```

#### 4.2 — Checklist Route API BitMove yang Perlu Dimigrasi

Cek setiap route di `apps/bitmove/app/api/`:
- [ ] `profiles/` — get dan update profile (XP, level, streak)
- [ ] `tasks/` — CRUD tasks + complete task + reset daily/weekly
- [ ] `workouts/` — buat sesi / tambah exercise / complete set / finish workout
- [ ] `programs/` — CRUD training programs + schedules
- [ ] `rewards/` — CRUD rewards + redeem
- [ ] `gamification/` — level up check, tier update, streak bonus
- [ ] `dashboard/` — summary: today's tasks, active workout, streak, XP bar

---

### FASE 5 — Bangun `apps/hub` (Portfolio + Dashboard) *(Minggu 3–4)*

> **Tujuan:** Ini adalah wajah utama dari seluruh ekosistem.

#### 5.1 — Inisialisasi Hub App

```bash
cd apps/hub
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-import-alias
```

**`apps/hub/package.json` (tambahkan dependencies):**
```json
{
  "name": "@superapp/hub",
  "dependencies": {
    "@woilaa/db-auth": "workspace:*",
    "@superapp/ui": "workspace:*",
    "jose": "^5.9.0",
    "postgres": "^3.4.5"
  }
}
```

#### 5.2 — Halaman Portfolio (Public)

**Route `/` — Landing Page:**
```
Hero Section:
  - Nama & Tagline (animasi GSAP / Framer Motion)
  - Dua CTA: "Lihat Proyek" & "Login ke Platform"
  - Background: Animated gradient / particle effect

About Section:
  - Foto + Bio
  - Tech stack badges

Projects Section:
  - Card MyKanz (Finance App) → link ke /finance
  - Card BitMove (RPG Fitness) → link ke /quests

Skills / Timeline Section

Contact Section:
  - GitHub, LinkedIn, Email
```

**Route `/projects/[slug]` — Detail Proyek**

#### 5.3 — Auth Terpusat di Hub

Login/Register ada di `apps/hub`:
- `/login` → form login → call API Hub → set cookie domain-level
- `/register` → form register → call API Hub → auto-login

**`apps/hub/app/api/auth/login/route.ts`:**
```typescript
// Verifikasi user dari @woilaa/db-auth
// Set cookie: access_token (domain: .roisanwr.me di production)
response.cookies.set("access_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  domain: process.env.NODE_ENV === "production" ? ".roisanwr.me" : "localhost",
  maxAge: 60 * 15, // 15 menit
});
```

> Cookie dengan domain `.roisanwr.me` akan otomatis dibaca oleh `mykanz` (di `/finance`) dan `bitmove` (di `/quests`) — inilah mekanisme SSO-nya.

#### 5.4 — Dashboard Hub (Private)

**Route `/dashboard` — Command Center:**
```
┌────────────────────────────────────────────────────┐
│  👋 Selamat Datang, {name}                         │
│  {tanggal} · Winstreak: 🔥 {streak} hari           │
├──────────────────────┬─────────────────────────────┤
│  💰 FINANCE (MyKanz) │  ⚔️ QUESTS (BitMove)        │
│  Total Aset: Rp X    │  Level {n} · XP: {x}/{max}  │
│  Pengeluaran bulan   │  Quest hari ini: {n}/5 done  │
│  ini: Rp Y           │  Winstreak: {n} hari         │
│  [Buka Finance →]    │  [Buka Quests →]             │
└──────────────────────┴─────────────────────────────┘
```

Data diambil paralel dari kedua API:
```typescript
const [financeData, questData] = await Promise.all([
  fetch(`${process.env.MYKANZ_URL}/api/dashboard/summary`, {
    headers: { Cookie: `access_token=${token}` }
  }),
  fetch(`${process.env.BITMOVE_URL}/api/dashboard/summary`, {
    headers: { Cookie: `access_token=${token}` }
  }),
]);
```

#### 5.5 — Konfigurasi Multi-Zones

```typescript
// apps/hub/next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/finance/:path*",
        destination: `${process.env.MYKANZ_URL}/finance/:path*`,
      },
      {
        source: "/quests/:path*",
        destination: `${process.env.BITMOVE_URL}/quests/:path*`,
      },
    ];
  },
};

// apps/mykanz/next.config.ts
const nextConfig = {
  basePath: "/finance",
};

// apps/bitmove/next.config.ts
const nextConfig = {
  basePath: "/quests",
};
```

---

### FASE 6 — Penyatuan UI/UX "Beda Rasa, Satu DNA" *(Minggu 4–5)*

> **Tujuan:** User merasakan perpindahan "mode", bukan perpindahan aplikasi.

#### 6.1 — Design System via CSS Variables

Package `@superapp/ui` mendefinisikan interface variabel CSS:
```css
/* packages/ui/src/tokens.css */
:root {
  --color-primary: ;
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

**MyKanz Theme** (Elegan, Profesional, Finance):
```css
:root {
  --color-primary: oklch(65% 0.15 160);   /* Emerald */
  --color-surface: oklch(98% 0.01 240);   /* Off-white */
  --color-text: oklch(20% 0.02 240);      /* Deep slate */
  --font-sans: 'Inter', sans-serif;
}
```

**BitMove Theme** (Gaming, Dark, Neon):
```css
:root {
  --color-primary: oklch(65% 0.2 230);    /* Neon Blue */
  --color-surface: oklch(12% 0.02 240);   /* Near-black */
  --color-text: oklch(95% 0.01 240);      /* Near-white */
  --font-sans: 'Rajdhani', sans-serif;
}
```

#### 6.2 — Animasi Transisi Mode dengan GSAP

> `plan.md` menyebutkan akan pakai GSAP.

```typescript
// Transisi Finance → Quests: efek "memasuki dungeon"
gsap.timeline()
  .to(overlay, { opacity: 1, duration: 0.3 })
  .add(() => router.push("/quests"))
  .to(overlay, { opacity: 0, duration: 0.3 });
```

#### 6.3 — Persistent Bottom Navigation (Mobile)

Di layar mobile, ganti sidebar dengan Bottom Nav persisten:
```
┌────────────────────────┐
│     [Content Area]     │
├────────────────────────┤
│ 🏠 Hub │ 💰 Finance │ ⚔️ │
└────────────────────────┘
```

---

### FASE 7 — PWA & Production Deploy *(Minggu 6)*

> **Tujuan:** Go live di Vercel.

#### 7.1 — PWA Setup (di Hub)

```bash
cd apps/hub
pnpm add next-pwa
```

**`apps/hub/public/manifest.json`:**
```json
{
  "name": "roisanwr platform",
  "short_name": "roisanwr",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### 7.2 — Vercel Deployment (3 Project)

| Vercel Project | Root Directory | Domain |
|----------------|----------------|--------|
| `superapp-hub` | `apps/hub` | `roisanwr.me` |
| `superapp-mykanz` | `apps/mykanz` | internal (via Hub rewrites) |
| `superapp-bitmove` | `apps/bitmove` | internal (via Hub rewrites) |

#### 7.3 — Environment Variables Vercel

**Shared (semua app):**
```
JWT_SECRET=...
JWT_REFRESH_SECRET=...
AUTH_DATABASE_URL=...
```

**Hub:**
```
MYKANZ_URL=https://finance-internal.roisanwr.me
BITMOVE_URL=https://quests-internal.roisanwr.me
```

**MyKanz:**
```
MYKANZ_DATABASE_URL=...
```

**BitMove:**
```
BITMOVE_DATABASE_URL=...
```

---

### FASE 8 (BONUS) — Fitur Cross-App *(Pasca Launch)*

#### 8.1 — Reward Finance dari Quest Achievement
- Selesaikan misi di BitMove → unlock "cashback kategori" di MyKanz
- Implementasi: API call dari BitMove ke endpoint khusus Hub yang update DB MyKanz (menggunakan service token, bukan user JWT)

#### 8.2 — XP Reward dari Tabungan Target
- Capai target saving di MyKanz → dapat XP bonus di BitMove
- Sama: API call via Hub internal service

#### 8.3 — Unified Notification Center
- Dashboard Hub polling dari kedua service
- Push via PWA Service Worker

#### 8.4 — Public Profile
- `roisanwr.me/u/roisan` → Level BitMove + streak + badges

---

## 🏗️ STACK FINAL (DIPERBARUI)

| Concern | Teknologi | Alasan |
|---------|-----------|--------|
| Monorepo | Turborepo + pnpm | Cepat, build caching, standar industri |
| Framework | Next.js 16+ (App Router) | SSR, multi-zones, sudah dipakai |
| **ORM** | **Drizzle ORM** | **Type-safe, lebih ringan dari Prisma, tanpa generate** |
| **Auth** | **Custom JWT (jose)** | **Full kontrol, SSO via shared JWT_SECRET + cookie domain** |
| Auth DB | `authdb` di Supabase PostgreSQL | users, sessions, app_access |
| Finance DB | `mykanzdb` di Supabase PostgreSQL | Schema finance lengkap |
| Quests DB | `bitmovedb` di Supabase PostgreSQL | Schema gamification lengkap |
| Styling | Tailwind CSS v4 + CSS Variables | Theming per-app |
| Animasi | GSAP (plan.md) | Transisi premium antar mode |
| PWA | next-pwa | Mudah diintegrasikan |
| Deploy | Vercel | Zero-config Next.js |
| Analytics | Vercel Analytics | Sudah bundled |

---

## 📋 CHECKLIST EKSEKUSI (PRIORITAS TERURUT)

### Segera (Fase 1 — DB Packages)
- [ ] Buat `packages/db-auth/` dari `databaseNEW/authdb/`
  - [ ] Tambah `package.json` dengan nama `@woilaa/db-auth`
  - [ ] Buat `src/client.ts` (Drizzle instance)
  - [ ] Buat `drizzle.config.ts`
  - [ ] Buat `tsconfig.json`
- [ ] Buat `packages/db-mykanz/` dari `databaseNEW/mykanzdb/`
  - [ ] Tambah `package.json` dengan nama `@woilaa/db-mykanz`
  - [ ] Buat `src/client.ts`
  - [ ] Buat `drizzle.config.ts`
  - [ ] Buat `tsconfig.json`
- [ ] Buat `packages/db-bitmove/` dari `databaseNEW/db-bitmove/`
  - [ ] Tambah `package.json` dengan nama `@woilaa/db-bitmove`
  - [ ] Buat `src/client.ts`
  - [ ] Buat `drizzle.config.ts`
  - [ ] Buat `tsconfig.json`
- [ ] Jalankan `pnpm install` dari root
- [ ] Verifikasi semua package bisa di-resolve

### Minggu 1 (Fase 2 — Migrasi Auth)
- [ ] Setup JWT helper (`lib/jwt.ts`) di mykanz
- [ ] Buat API route auth baru di mykanz (`/api/auth/login`, `/register`, `/logout`, `/refresh`)
- [ ] Hapus Prisma + NextAuth dari mykanz
- [ ] Update middleware mykanz ke custom JWT
- [ ] Lakukan hal yang sama untuk bitmove
- [ ] Test: login → dapat cookie → akses protected route

### Minggu 2 (Fase 3–4 — Migrasi API Routes)
- [ ] Migrasi semua API route MyKanz dari Prisma ke Drizzle
- [ ] Migrasi semua API route BitMove dari Prisma ke Drizzle
- [ ] Test end-to-end: semua fitur mykanz & bitmove berjalan normal

### Minggu 3 (Fase 5 — Hub App)
- [ ] Inisialisasi `apps/hub`
- [ ] Bangun Portfolio Landing Page
- [ ] Integrasi auth terpusat di Hub
- [ ] Bangun Dashboard Hub dengan widget summary

### Minggu 4 (Fase 6 — UI/UX)
- [ ] Lengkapi `@superapp/ui` dengan komponen shared
- [ ] Implementasi CSS variable theming per app
- [ ] Implementasi animasi transisi GSAP

### Minggu 5–6 (Fase 7 — PWA + Deploy)
- [ ] Setup PWA di Hub
- [ ] Deploy 3 project di Vercel
- [ ] Setup custom domain
- [ ] End-to-end test production

---

## ⚠️ POIN KRITIS YANG PERLU DIPERHATIKAN

### 1. Drizzle Client — Jangan Buat Koneksi Berlebih
Di Next.js, setiap hot reload bisa buat koneksi baru ke PostgreSQL. Pakai pola singleton:

```typescript
// packages/db-mykanz/src/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

// Singleton untuk development (hindari koneksi berlebih saat hot reload)
const globalForDb = globalThis as unknown as { mykanzClient: ReturnType<typeof postgres> };

const client = globalForDb.mykanzClient ?? postgres(process.env.MYKANZ_DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  globalForDb.mykanzClient = client;
}

export const db = drizzle(client, { schema });
```

### 2. JWT_SECRET Harus Identik di Semua App
Karena login bisa terjadi di Hub atau di masing-masing app, dan token harus bisa diverifikasi di semua app — pastikan nilai `JWT_SECRET` di `.env` masing-masing app **identik**.

### 3. Cross-DB userId — Tidak Ada FK, Validasi di App Layer
- `wallets.userId` di mykanzdb **bukan FK** ke authdb — nilainya dari JWT payload
- Validasi: cukup `eq(wallets.userId, userId)` dari JWT, tidak perlu join ke authdb
- Ini adalah trade-off dari multi-DB architecture — konsisten, tapi tidak ada referential integrity di level DB

### 4. Cookie Domain untuk SSO
- Development: cookie tanpa domain (berlaku untuk `localhost` saja)
- Production: cookie dengan `domain: ".roisanwr.me"` agar berlaku di semua subdomain

### 5. Drizzle Query API vs Raw SQL
- Pakai **Drizzle Query API** (`db.query.wallets.findMany(...)`) untuk query sederhana
- Pakai **Drizzle ORM API** (`db.select().from()...`) untuk query kompleks dengan join
- Pakai raw SQL (`db.execute(sql`...`)`) hanya untuk operasi yang benar-benar tidak bisa di-express

---

## 📅 TIMELINE REALISTIS (DIPERBARUI)

| Minggu | Fase | Deliverable |
|--------|------|-------------|
| **Sekarang** | 1 — DB Packages | 3 Drizzle packages jalan, bisa di-import dari apps |
| **1** | 2 — Auth Migrasi | Login/Register pakai custom JWT, Prisma & NextAuth dihapus |
| **2** | 3–4 — API Migrasi | Semua API route berjalan dengan Drizzle query |
| **3** | 5 — Hub App | Landing page + Dashboard Hub + Multi-zones |
| **4** | 6 — UI/UX | Theming, GSAP transitions, Mobile nav |
| **5** | 7 — Deploy | PWA + Vercel production + custom domain |
| **6+** | 8 — Iterasi | Cross-app features, blog, public profile |

---

*Diperbarui: 13 April 2026 · Platform: roisanwr.me · ORM: Drizzle (migrasi dari Prisma)*
