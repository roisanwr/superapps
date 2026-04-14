import { db } from "@/lib/db";
import { trainingPrograms, programSchedules, exerciseLibrary } from "@woilaa/db-bitmove";
import { eq, and } from "drizzle-orm";
import { differenceInCalendarWeeks } from "date-fns";

/**
 * Menghitung minggu playlist saat ini berdasarkan start_date program.
 * Menggunakan rumus modulo agar looping otomatis.
 */
export async function getTodayWorkoutPlan(userId: string) {
  // 1. Cari program yang sedang AKTIF
  const activeProgram = await db.query.trainingPrograms.findFirst({
    where: and(
      eq(trainingPrograms.userId, userId),
      eq(trainingPrograms.isActive, true)
    ),
    with: {
      schedules: {
        with: {
          exercise: true,
        },
      },
    },
  });

  if (!activeProgram) return { hasPlan: false, activeProgram: null, todaysSchedule: [] };

  // 2. Hitung jarak minggu: Hari ini vs Tanggal Mulai Program
  const today = new Date();
  const startDate = activeProgram.startDate
    ? new Date(activeProgram.startDate)
    : new Date();

  const weeksDiff = differenceInCalendarWeeks(today, startDate, {
    weekStartsOn: 1, // Senin sebagai awal minggu
  });

  // 3. ✨ Rumus Modulo — satu-satunya keajaiban yang kita butuhkan
  // Jika weeksDiff=4 dan total_weeks=2: (4 % 2) + 1 = 1 (Minggu pertama lagi!)
  const currentPlaylistWeek =
    (weeksDiff % activeProgram.totalWeeks) + 1;

  // 4. Konversi hari JS (Minggu=0, Senin=1) → ISO (Senin=1, Minggu=7)
  let currentDayOfWeek = today.getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7;

  // 5. Tarik schedule hari ini dari array yang sudah di-include
  const todaysSchedule = activeProgram.schedules.filter(
    (s) =>
      s.weekNumber === currentPlaylistWeek &&
      s.dayOfWeek === currentDayOfWeek
  );

  return {
    hasPlan: true,
    activeProgram: {
      id: activeProgram.id,
      title: activeProgram.title,
      totalWeeks: activeProgram.totalWeeks,
      currentWeek: currentPlaylistWeek,
      startDate: activeProgram.startDate,
    },
    todaysSchedule,
  };
}
