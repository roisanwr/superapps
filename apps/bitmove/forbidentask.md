# Forbidden Tasks (Negative Quests) — Skema & Rencana Implementasi

## Latar Belakang
Saat ini sistem Quest hanya mencakup "Tugas Positif" (hal-hal yang harus diselesaikan untuk mendapat EXP/Points). Namun, dalam *self-improvement*, menghentikan kebiasaan buruk sama pentingnya dengan membangun kebiasaan baik. 

Kebutuhan: Sistem untuk mencatat **Pantangan / Forbidden Tasks** (contoh: Makan Junkfood, Nonton Bokep, Begadang, dll). Jika user melanggar pantangan tersebut, mereka akan **terkena denda (Penalti XP/Point atau Hilang Winstreak)**.

---

## Opsi Implementasi: Bikin Tabel Baru vs Modifikasi Tabel Lama

### Opsi A: Tabel Baru (`forbidden_tasks` & `violations_log`)
Sistem dipisah sepenuhnya dari tabel `tasks` (Quests) saat ini. 
- **Pro:** Logic tidak akan bertabrakan dengan sistem daily quests saat reset harian (karena pantangan tidak punya konsep "harus dicentang tiap hari", melainkan "jangan ditekan").
- **Kontra:** Harus bikin migrasi Prisma baru, UI List baru di dashboard, dan Service CRUD baru dari nol.

### Opsi B: Modifikasi / Re-use Tabel `tasks` & `task_library` 🔥 (SANGAT DIREKOMENDASIKAN)
Menambahkan tipe/kategori khusus di tabel yang sudah ada. Konsepnya: kita menjadikan "Forbidden" sebagai salah satu `task_type` (atau lewat custom flag).
- **Pro:** Jauh lebih cepat dikerjakan, tidak perlu rombak database besar-besaran (tinggal tambah 1 kolom text/boolean), re-use komponen List yang sudah ada.
- **Kontra:** Perlu mengubah sedikit logic di fungsi cron job/reset harian (karena task negatif yang tidak dicentang berarti Misi Berhasil, bukan Gagal).

---

## Rincian Solusi Terbaik (Pendekatan Opsi B)

Menurutku, **kita TIDAK PERLU membuat tabel baru**. Sistem `tasks` kita sudah sangat kuat. Kita hanya perlu menambahkan konsep **Polarity (Kutub)** pada task.

### 1. Perubahan Database Schema
Tambahkan 1 kolom baru di `tasks` dan `task_library`:
```prisma
// schema.prisma
model tasks {
  // ... kolom lama ...
  polarity String @default("POSITIVE") // Bisa "POSITIVE" atau "NEGATIVE"
}

model task_library {
  // ... kolom lama ...
  polarity String @default("POSITIVE")
}
```
*Catatan: Menambah kolom dengan `@default` di Prisma sangat aman dan tidak merusak data lama.*

### 2. Cara Kerja (Flow Logic)

1. **Pembuatan Task:** 
   Saat bikin Directive/Quest baru, ada toggle: "🎯 Objective" (Positive) atau "🚫 Forbidden" (Negative).
   
2. **Tampilan di UI (Dashboard):**
   - **Positive Task:** Warna aksen hijau/kuning. Ditekan = Centang (Berhasil), dapat XP.
   - **Negative Task:** Tampil dengan list khusus (Warna Merah/Hitam). Tekan tombol = "SAYA MELANGGAR" 💀. 

3. **Perhitungan Denda (Penalti):**
   Jika "SAYA MELANGGAR" ditekan:
   - Status menjadi `is_completed = true` (dalam konteks ini: pelanggaran selesai dilakukan).
   - Server mengurangi (minus) **-100 XP** dan **-50 Points** (atau dinamis berdasarkan tingkat bahayanya / Priority).
   - (Opsional) Meng-reset *Winstreak* menjadi 0 detik itu juga sebagai hukuman berat.

4. **Reset Harian (The Twist):**
   Di `resetDailyTasks` (Cron/Automation yang pernah kita buat):
   - Jika Task **Positif** tidak dicentang -> Anggap bolong/gagal -> Pengaruh ke Winstreak drop.
   - Jika Task **Negatif** TIDAK DICENTANG -> Wahai pahlawan, kamu telah berhasil menahan hawa nafsu! -> Berikan bonus +XP pasif. Lalu reset.
   - Jika Task **Negatif** DICENTANG -> Hari itu sudah tercatat melanggar. Besok di-reset kembali supaya bisa menahan diri lagi.

---

## Langkah Implementasi Teknis (Roadmap)

Jika kamu setuju dengan plan Opsi B (re-use database dengan nambah kolom `polarity`), ini urutan kerjanya:

1. **Database Migration:** 
   Update `prisma.schema` menambah field `polarity` string default "POSITIVE". Jalankan `npx prisma db push`.
   
2. **Update Master Data CRUD:**
   Ubah Form di `TaskLibraryClient.tsx` untuk bisa memilih tipe Positive/Negative.

3. **Update UI Dashboard (Quests):**
   - Pisahkan render `dailyTasks` menjadi tiga kategori: Daily Directives, Weekly Objectives, dan **Forbidden Protocols** (Pantangan).
   - Buat tombol khusus untuk Forbidden (warna merah, ikon tengkorak/silang). Modal Konfirmasi berbunyi: *"Apakah kamu yakin telah gagal menahan diri dan melakukan pantangan ini? Hukuman berat menanti."*

4. **Update Core Logic & Server Actions:**
   - Di fungsi `toggleTask`, baca `polarity`. Kalau "NEGATIVE", hitung minus poin, insert ke log activity sebagai `PENALTY`.
   - Di `app/api/cron/reset/route.ts`, beri pengecualian Winstreak: jika punya Negative task yang tidak dicentang (resisted), maka itu dianggap *Success*.

---

*Gimana pendapatmu bro? Lebih prefer nambah satu kolom aja kaya ideku di atas, atau mau dibikin bener-bener tabel yang terpisah (Opsi A)? Klo oke Opsi B, tinggal kabarin buat aku eksekusi!*
