# Library Program — Rencana Implementasi Detail

## Latar Belakang

Saat ini program latihan hanya bisa dibuat secara personal (user bikin sendiri dari awal di Builder).
Tidak ada cara memberi user sebuah "starting point" atau referensi jadwal yang sudah terbukti bagus.
Tujuan fitur ini: membolehkan tersedianya **Program Template** yang bisa langsung "dicopy dan dipakai"
oleh user, tanpa mengubah database schema yang sudah ada.

---

## Filosofi / Prinsip Rancangan

- **Tidak ada tabel baru di database.** Semua template disimpan di server-side saja (file JSON/TS), bukan di Postgres.
- **Template = Blueprint.** Ketika user memilih template, data schedule dari blueprint di-clone menjadi `training_programs` milik user (di DB), bukan memodifikasi source-nya.
- **Template bisa diedit sebelum diaktifkan.** Setelah user memilih template, langsung pre-load ke Builder — user bisa tambah/hapus slot, ganti tier, baru simpan.
- **Personalisasi tetap utuh.** Setelah user simpan, dia punya program sendiri. Perubahan template dari "admin" tidak mempengaruhi program user yang sudah dibuat.

---

## Arsitektur

### 1. File Definisi Template (Static Data)

Buat folder dan file baru:

```
/lib/program-templates/
  index.ts          ← ekspor daftar semua template
  push-pull-legs.ts
  full-body-4week.ts
  hiit-cardio.ts
  (dst...)
```

Setiap template mengikuti `TemplateDefinition` type:

```typescript
// /lib/program-templates/types.ts
export interface TemplateSlot {
  weekNumber: number;   // 1–4
  dayOfWeek: number;    // 1–7 (Senin–Minggu)
  exerciseName: string; // nama gerakan (untuk display)
  targetTier: TierEnum; // 'C' | 'B' | 'A' | 'S' | 'SS'
  // NOTE: exerciseId TIDAK ada di sini karena template bersifat generik.
  // Matching ke exercise_library dilakukan saat clone (step runtime).
}

export interface TemplateDefinition {
  id: string;           // slug unik, contoh: "push-pull-legs-4w"
  title: string;
  description: string;
  totalWeeks: number;
  category: "Strength" | "Endurance" | "HIIT" | "Mobility" | "General";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  slots: TemplateSlot[];
}
```

### 2. Library Page — `/training/library`

Halaman baru yang menampilkan grid semua template. Layout:
- Filter tab per kategori (Strength, Endurance, HIIT, dll.)
- Setiap card template menampilkan: title, deskripsi singkat, total minggu, badge kategori dan difficulty
- Tombol **"GUNAKAN TEMPLATE"** di tiap card

File yang dibuat:
```
app/(dashboard)/training/library/
  page.tsx         ← Server Component, render ProgramLibraryClient
  ProgramLibraryClient.tsx  ← Client Component, handle filter & navigation
```

### 3. Clone Logic — Server Action

Saat user menekan "GUNAKAN TEMPLATE":

```
app/(dashboard)/training/library/actions.ts
  → cloneTemplateToUser(templateId: string)
```

Flow inside action:
1. Load template definition dari `/lib/program-templates/index.ts` berdasarkan `templateId`.
2. **Match exercise**: Untuk setiap slot di template, query `exercise_library` mencari nama yang LIKE `%exerciseName%` (fuzzy match). Jika tidak ketemu, skip slot atau gunakan fallback default.
3. Panggil `createAndActivateProgram()` (yang sudah ada) untuk buat program baru ke DB milik user.
4. Redirect ke `/training/builder?edit=[newProgramId]` supaya user bisa review/edit sebelum aktif.

### 4. Update Builder — Integrasi

Di halaman `/training/builder/page.tsx`, tambahkan banner/notice top ketika datang dari clone template:

```
// Tambahkan query param: ?edit=[id]&from=template
// Jika ada from=template, tampilkan notice: "Program ini dibuat dari template. Sesuaikan sebelum diaktifkan!"
```

### 5. Navigasi

Update sidebar/menu Training Ground:
- Di bawah tombol "BUILD PROGRAM", tambahkan secondary link: **"Lihat Library Template"** → ke `/training/library`
- Di halaman `/training` saat tidak ada program aktif (STATE C), tambahkan tombol ketiga: **"MULAI DARI TEMPLATE"** di samping "BUILD PROGRAM" dan "SESI SPONTAN".

---

## Daftar File yang Dibuat/Diubah

| File | Status | Keterangan |
|------|--------|------------|
| `/lib/program-templates/types.ts` | BARU | Definisi type TemplateDefinition & TemplateSlot |
| `/lib/program-templates/index.ts` | BARU | Ekspor `PROGRAM_TEMPLATES: TemplateDefinition[]` |
| `/lib/program-templates/push-pull-legs.ts` | BARU | Contoh template PPL 4 minggu |
| `/lib/program-templates/full-body.ts` | BARU | Contoh template Full Body |
| `app/(dashboard)/training/library/page.tsx` | BARU | Halaman Library |
| `app/(dashboard)/training/library/ProgramLibraryClient.tsx` | BARU | Client Component dengan filter |
| `app/(dashboard)/training/library/actions.ts` | BARU | Server Action cloneTemplateToUser |
| `app/(dashboard)/training/page.tsx` | UBAH | Tambah tombol "MULAI DARI TEMPLATE" di STATE C |
| `app/(dashboard)/training/builder/page.tsx` | UBAH | Tambah banner "from=template" notice |

---

## Contoh Template File

```typescript
// /lib/program-templates/push-pull-legs.ts
import { TemplateDefinition } from "./types";

export const pushPullLegs: TemplateDefinition = {
  id: "push-pull-legs-4w",
  title: "Push Pull Legs — 4 Minggu",
  description: "Program klasik PPL cocok untuk intermediate. Latihan 6 hari/minggu dengan pemisahan otot push, pull, dan legs.",
  totalWeeks: 4,
  category: "Strength",
  difficulty: "Intermediate",
  slots: [
    // Week 1
    { weekNumber: 1, dayOfWeek: 1, exerciseName: "Bench Press",     targetTier: "B" },
    { weekNumber: 1, dayOfWeek: 1, exerciseName: "Overhead Press",  targetTier: "C" },
    { weekNumber: 1, dayOfWeek: 1, exerciseName: "Tricep Pushdown", targetTier: "C" },
    { weekNumber: 1, dayOfWeek: 2, exerciseName: "Pull Up",         targetTier: "C" },
    { weekNumber: 1, dayOfWeek: 2, exerciseName: "Barbell Row",     targetTier: "B" },
    { weekNumber: 1, dayOfWeek: 2, exerciseName: "Bicep Curl",      targetTier: "C" },
    { weekNumber: 1, dayOfWeek: 3, exerciseName: "Squat",           targetTier: "B" },
    { weekNumber: 1, dayOfWeek: 3, exerciseName: "Romanian Deadlift", targetTier: "C" },
    { weekNumber: 1, dayOfWeek: 3, exerciseName: "Calf Raise",      targetTier: "D" },
    // Week 2–4 repeats with tier progression...
    // (copy Week 1 slots dengan weekNumber 2,3,4 dan opsional naikkan tier)
  ],
};
```

---

## Catatan Penting (Edge Cases)

- **Exercise name matching**: Template memakai nama generik ("Bench Press"). Jika di `exercise_library` user namanya beda ("Flat Bench Press"), system harus fuzzy match menggunakan `ILIKE %keyword%` di Prisma. Jika tidak ketemu sama sekali, slot di-skip dan user dikasih notifikasi berapa slot yang tidak berhasil di-load.
- **Template tidak butuh exercise yang ada**: Template mendefinisikan "konsep" latihan. Matching dilakukan saat runtime clone. Admin tidak perlu sinkronisasi template dengan exercise library.
- **No Admin Panel diperlukan**: Template ditambahkan cukup dengan menambah file baru di `/lib/program-templates/` — tidak perlu UI admin khusus. Deploy ulang = template baru aktif.
- **User bisa modifikasi bebas**: Setelah clone, program 100% milik user. User bisa hapus slot yang tidak cocok, isi yang kosong, atau ubah tier sesuai kemampuan.

---

## Roadmap Implementasi

1. **Phase 1 — Foundation** (Prioritas Tinggi)
   - Buat `/lib/program-templates/types.ts` dan `index.ts`
   - Buat 2–3 template awal (Full Body Beginner, PPL Intermediate)
   - Buat `/training/library/page.tsx` + `ProgramLibraryClient.tsx` (tampilan card grid, belum ada clone)
   
2. **Phase 2 — Clone Mechanism**
   - Buat `cloneTemplateToUser()` server action
   - Implementasi fuzzy exercise matching
   - Integrasi redirect ke builder setelah clone
   
3. **Phase 3 — Polish**
   - "From Template" banner di builder
   - Tambah more templates
   - Update Training Ground page STATE C untuk ada tombol library

---

*File ini dibuat: 07 Apr 2026*
*Status: DRAFT — Belum diimplementasikan*
