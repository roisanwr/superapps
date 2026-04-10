🗺️ GRAND MASTER PLAN: BitMove v2.0 (Hybrid API & Infinite Workout System)

Codename: Operation "Iron Loop & Seamless API"
Visi Utama: 1. Mengubah sistem olahraga mendadak (ad-hoc) menjadi Sistem Playlist Workout (Custom Builder 1-4 Minggu yang looping otomatis).
2. Membangun Arsitektur Service-Oriented (SOA) agar fitur-fitur ini bisa dipakai oleh Next.js Web (via Server Actions) dan Flutter Mobile App (via REST API) tanpa duplikasi kode.

🏗️ 1. ARSITEKTUR DIREKTORI (THE HYBRID ENGINE)

Pemisahan logika adalah kunci. Kita dilarang menulis kode Prisma langsung di dalam komponen UI atau File Route API. Semua harus terpusat di /lib/services.

bitmove/
├── app/
│   ├── (dashboard)/
│   │   ├── training/
│   │   │   ├── builder/page.tsx   # UI: Form untuk meracik jadwal 1-4 minggu
│   │   │   ├── page.tsx           # UI: Menampilkan misi olahraga HARI INI
│   │   │   └── actions.ts         # Server Actions (Hanya memanggil /services)
│   ├── api/                       # JENDELA DRIVE-THRU UNTUK FLUTTER 📱
│   │   ├── auth/mobile/route.ts   # Endpoint Login Khusus Mobile (Return JWT)
│   │   ├── training/
│   │   │   ├── program/route.ts   # GET/POST Pembuatan Program Latihan
│   │   │   └── today/route.ts     # GET Latihan hari ini (manggil workoutService)
├── lib/
│   ├── prisma.ts                  # Koneksi DB (Existing)
│   └── services/                  # 🧠 OTAK UTAMA APLIKASI (THE CORE ENGINE)
│       ├── authService.ts         # Verifikasi Token JWT (Flutter) & NextAuth Session
│       ├── questService.ts        # Logika Misi Produktivitas (Existing)
│       └── workoutService.ts      # Logika Cerdas Looping & Perhitungan XP Tier


🗄️ 2. SKEMA DATABASE: REVISI & PENAMBAHAN (PRISMA)

Sistem Playlist Workout membutuhkan tabel baru sebagai "Cetak Biru" jadwal, yang dipisahkan dari tabel Log eksekusi harian (workouts, sets).

Tambahkan skema berikut ke dalam file schema.prisma milikmu:

A. Tabel Baru: Cetak Biru Jadwal (The Blueprint)

// 1. Induk Program / Playlist (Menyimpan Metadata)
model training_programs {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id        String    @db.Uuid
  title          String    // Misal: "Program Pembentukan Otot Sparky"
  total_weeks    Int       // Durasi siklus (1, 2, 3, atau 4)
  is_active      Boolean   @default(true) // Hanya 1 program yang boleh aktif per user
  start_date     DateTime  @default(now()) @db.Date // Kunci penentu rotasi minggu
  created_at     DateTime  @default(now()) @db.Timestamptz(6)
  
  profiles       profiles  @relation(fields: [user_id], references: [id], onDelete: Cascade)
  schedules      program_schedules[]
  
  // Catatan: Jika ganti program, program lama is_active diset false.
}

// 2. Detail Jadwal per Hari (Menyimpan Isi Playlist)
model program_schedules {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  program_id     String    @db.Uuid
  week_number    Int       // Minggu ke: 1, 2, 3, atau 4
  day_of_week    Int       // Hari ke: 1 (Senin) sampai 7 (Minggu)
  exercise_id    String    @db.Uuid // Mengambil dari tabel exercise_library
  target_tier    tier_enum // Target kesulitan (Misal: 'C')
  notes          String?   // Pesan penyemangat / instruksi form
  
  program        training_programs @relation(fields: [program_id], references: [id], onDelete: Cascade)
  exercise       exercise_library  @relation(fields: [exercise_id], references: [id])
}


B. Relasi ke Tabel Existing (The Execution Log)

Tabel workouts dan sets yang sudah kamu miliki TETAP DIGUNAKAN persis seperti sekarang.
Bedanya: Dulu data ini dibuat secara mendadak/bebas. Nanti, data workouts dan sets ini di- generate (dibuat) berdasarkan panduan dari program_schedules pada hari tersebut.

🧠 3. LOGIKA INTI: SIHIR "INFINITE LOOPING"

Ini adalah logika yang akan hidup di dalam lib/services/workoutService.ts. Fungsi ini akan dipanggil oleh UI Web maupun API Flutter setiap kali user membuka aplikasi untuk melihat "Menu Hari Ini".

// Pseudocode Logika Looping di workoutService.ts
import prisma from "@/lib/prisma";
import { differenceInCalendarWeeks } from "date-fns"; 

export async function getTodayWorkoutPlan(userId: string) {
  // 1. Cari program yang sedang AKTIF untuk user ini
  const activeProgram = await prisma.training_programs.findFirst({
    where: { user_id: userId, is_active: true }
  });

  if (!activeProgram) return { hasPlan: false, data: null };

  // 2. Hitung jarak minggu: Hari ini vs Tanggal Mulai Program (start_date)
  const today = new Date();
  const weeksDiff = differenceInCalendarWeeks(today, activeProgram.start_date, { weekStartsOn: 1 }); // Senin sebagai awal minggu

  // 3. ✨ THE MAGIC: Rumus Modulo ✨
  // Jika weeksDiff = 4, dan total_weeks = 2. Maka (4 % 2) + 1 = 1.
  // Sistem tahu bahwa ini saatnya memutar jadwal "Minggu ke-1" lagi!
  const currentPlaylistWeek = (weeksDiff % activeProgram.total_weeks) + 1;
  
  // Konversi hari JS (Minggu=0, Senin=1) menjadi format ISO (Senin=1, Minggu=7)
  let currentDayOfWeek = today.getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7; 

  // 4. Tarik Jadwal Hari Ini dari Database
  const todaysSchedule = await prisma.program_schedules.findMany({
    where: {
      program_id: activeProgram.id,
      week_number: currentPlaylistWeek,
      day_of_week: currentDayOfWeek
    },
    include: {
      exercise: true // Tarik detail nama gerakan (Push Up, dll)
    }
  });

  return { 
    hasPlan: true, 
    currentWeek: currentPlaylistWeek,
    data: todaysSchedule 
  };
}


🕹️ 4. ALUR PENGGUNAAN LENGKAP (UX FLOW)

A. Sang Peracik (Fase Setup - Custom Builder)

Pilih Durasi: Pemain membuka menu "Build Program". Memasukkan Judul Program dan memilih siklus (contoh: 2 Minggu).

Papan Tulis Matriks: Layar menampilkan 2 Tab (Minggu 1, Minggu 2). Masing-masing Tab berisi 7 kolom (Senin - Minggu).

Mengisi Matriks:

Pemain klik hari "Rabu" di "Minggu 1".

Sistem memunculkan Modal/Dropdown berisi exercise_library (Daftar Latihan).

Pemain memilih "Burpees".

Karena "Burpees" bertipe strength, sistem otomatis melirik tabel difficulty_scales dan memberikan pilihan target: Tier D (10 Reps), Tier C (15 Reps), dsb.

Pemain memilih Tier C. Disimpan ke tabel program_schedules.

Deploy: Pemain klik "Aktifkan Program". Tanggal hari ini dikunci sebagai start_date.

B. Sang Petarung (Fase Eksekusi - Hari H)

Layar Masuk: Hari Kamis, pemain membuka aplikasi. API Web/Flutter memanggil fungsi getTodayWorkoutPlan.

Tampilan Misi: Layar langsung menampilkan besar-besar: "Misi Hari Ini: Burpees (Tier C) & Lari (Tier D)".

Pencatatan Pertarungan (Log to DB):

Pemain menekan tombol "Mulai Pertarungan".

Di titik ini, sistem diam-diam membuat workouts (status: in_progress) dan workout_exercises.

Pemain melakukan latihan dan melaporkan bahwa ia berhasil menyelesaikan Burpees sesuai target Tier C.

Sistem membuat sets dengan is_completed = true.

Bonus "Keringat Ekstra":

Di bagian bawah misi utama, ada tombol [+ Tambah Latihan Spontan].

Jika pemain masih punya sisa tenaga, mereka bisa menambahkan latihan di luar jadwal 4-Minggu untuk mendapat pundi-pundi poin/XP tambahan.

Klaim Hadiah: Pemain klik "Selesai", dan sistem finishWorkout (logika lama yang dipertahankan) akan menjumlahkan XP berdasarkan Tier dan menembakkannya ke profil via Trigger PostgreSQL kesayanganmu.

📱 5. JEMBATAN MENUJU FLUTTER (API STRATEGY)

Saat kamu siap menyentuh Flutter, kamu tidak perlu merombak logika di atas. Kamu cukup membuat file Route seperti ini:

// File: app/api/training/today/route.ts
import { NextResponse } from "next/server";
import { getTodayWorkoutPlan } from "@/lib/services/workoutService";
import { validateMobileToken } from "@/lib/services/authService";

export async function GET(req: Request) {
  // 1. Flutter mengirimkan Token (JWT) di Header
  const userId = await validateMobileToken(req);
  if (!userId) return NextResponse.json({ error: "Akses Ditolak" }, { status: 401 });

  // 2. Panggil otak utamanya
  const plan = await getTodayWorkoutPlan(userId);

  // 3. Kirimkan JSON murni ke Flutter
  return NextResponse.json(plan);
}


Dengan begini, Flutter dan Next.js Web akan menampilkan Jadwal Hari Ini yang sama persis tanpa selisih sedetik pun!