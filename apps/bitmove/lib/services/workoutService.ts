import prisma from "@/lib/prisma";
import { differenceInCalendarWeeks } from "date-fns";

/**
 * Menghitung minggu playlist saat ini berdasarkan start_date program.
 * Menggunakan rumus modulo agar looping otomatis.
 */
export async function getTodayWorkoutPlan(userId: string) {
  // 1. Cari program yang sedang AKTIF
  const activeProgram = await prisma.training_programs.findFirst({
    where: { user_id: userId, is_active: true },
    include: {
      program_schedules: {
        include: {
          exercise_library: true,
        },
      },
    },
  });

  if (!activeProgram) return { hasPlan: false, activeProgram: null, todaysSchedule: [] };

  // 2. Hitung jarak minggu: Hari ini vs Tanggal Mulai Program
  const today = new Date();
  const startDate = activeProgram.start_date
    ? new Date(activeProgram.start_date)
    : new Date();

  const weeksDiff = differenceInCalendarWeeks(today, startDate, {
    weekStartsOn: 1, // Senin sebagai awal minggu
  });

  // 3. ✨ Rumus Modulo — satu-satunya keajaiban yang kita butuhkan
  // Jika weeksDiff=4 dan total_weeks=2: (4 % 2) + 1 = 1 (Minggu pertama lagi!)
  const currentPlaylistWeek =
    (weeksDiff % activeProgram.total_weeks) + 1;

  // 4. Konversi hari JS (Minggu=0, Senin=1) → ISO (Senin=1, Minggu=7)
  let currentDayOfWeek = today.getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7;

  // 5. Tarik schedule hari ini dari array yang sudah di-include
  const todaysSchedule = activeProgram.program_schedules.filter(
    (s) =>
      s.week_number === currentPlaylistWeek &&
      s.day_of_week === currentDayOfWeek
  );

  return {
    hasPlan: true,
    activeProgram: {
      id: activeProgram.id,
      title: activeProgram.title,
      totalWeeks: activeProgram.total_weeks,
      currentWeek: currentPlaylistWeek,
      startDate: activeProgram.start_date,
    },
    todaysSchedule,
  };
}
