import { eq, and } from "drizzle-orm";
import { db } from "../client";
import {
  trainingPrograms,
  programSchedules,
  type TrainingProgram,
  type NewTrainingProgram,
  type ProgramSchedule,
  type NewProgramSchedule,
} from "../schema/schema";

// =============================================================================
// programs.ts — CRUD untuk training_programs dan program_schedules
//
// Rotation logic (di app layer):
//   actual_week = ((current_week - 1) % defined_weeks) + 1
//   week_number di program_schedules = template week (1 s/d defined_weeks)
// =============================================================================

// -----------------------------------------------------------------------------
// TRAINING PROGRAMS
// -----------------------------------------------------------------------------

// Buat program baru — otomatis deactivate program lain yang aktif
export async function createProgram(
  userId: string,
  data: {
    title: string;
    totalWeeks: number;
    definedWeeks: number;
    startDate?: string;
  }
): Promise<TrainingProgram> {
  return await db.transaction(async (tx) => {
    // Deactivate semua program aktif user sebelumnya
    await tx
      .update(trainingPrograms)
      .set({ isActive: false })
      .where(
        and(
          eq(trainingPrograms.userId, userId),
          eq(trainingPrograms.isActive, true)
        )
      );

    // Buat program baru — otomatis jadi active
    const [program] = await tx
      .insert(trainingPrograms)
      .values({ userId, ...data, isActive: true })
      .returning();

    return program;
  });
}

export async function getProgramById(id: string): Promise<TrainingProgram | null> {
  const [program] = await db
    .select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.id, id));
  return program ?? null;
}

export async function getAllProgramsByUser(
  userId: string
): Promise<TrainingProgram[]> {
  return db
    .select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.userId, userId));
}

// Ambil program aktif user — hanya 1 per user
export async function getActiveProgram(
  userId: string
): Promise<TrainingProgram | null> {
  const [program] = await db
    .select()
    .from(trainingPrograms)
    .where(
      and(
        eq(trainingPrograms.userId, userId),
        eq(trainingPrograms.isActive, true)
      )
    );
  return program ?? null;
}

// Switch program aktif ke program lain yang sudah ada
export async function setActiveProgram(
  userId: string,
  programId: string
): Promise<TrainingProgram | null> {
  return await db.transaction(async (tx) => {
    // Deactivate semua
    await tx
      .update(trainingPrograms)
      .set({ isActive: false })
      .where(eq(trainingPrograms.userId, userId));

    // Activate yang dipilih
    const [activated] = await tx
      .update(trainingPrograms)
      .set({ isActive: true })
      .where(
        and(
          eq(trainingPrograms.id, programId),
          eq(trainingPrograms.userId, userId)
        )
      )
      .returning();

    return activated ?? null;
  });
}

export async function deleteProgram(
  programId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(trainingPrograms)
    .where(
      and(
        eq(trainingPrograms.id, programId),
        eq(trainingPrograms.userId, userId)
      )
    ).returning({ id: trainingPrograms.id });
  return result.length > 0;
}

// -----------------------------------------------------------------------------
// PROGRAM SCHEDULES
// week_number = template week (1 s/d defined_weeks), bukan actual week.
// day_of_week: 1 = Senin, 7 = Minggu.
// target_sets: opsional.
// -----------------------------------------------------------------------------

export async function addScheduleEntry(
  data: Omit<NewProgramSchedule, "id">
): Promise<ProgramSchedule> {
  const [entry] = await db
    .insert(programSchedules)
    .values(data)
    .returning();
  return entry;
}

// Bulk insert jadwal untuk satu minggu template sekaligus
export async function addScheduleWeek(
  entries: Omit<NewProgramSchedule, "id">[]
): Promise<ProgramSchedule[]> {
  return db.insert(programSchedules).values(entries).returning();
}

// Ambil seluruh schedule untuk satu program (semua template week)
export async function getScheduleByProgram(
  programId: string
): Promise<ProgramSchedule[]> {
  return db
    .select()
    .from(programSchedules)
    .where(eq(programSchedules.programId, programId))
    .orderBy(programSchedules.weekNumber, programSchedules.dayOfWeek);
}

// Ambil jadwal untuk hari tertentu (template week number + day_of_week)
// App layer yang menghitung template_week dari actual_week + defined_weeks
export async function getScheduleForDay(
  programId: string,
  templateWeek: number,
  dayOfWeek: number
): Promise<ProgramSchedule[]> {
  return db
    .select()
    .from(programSchedules)
    .where(
      and(
        eq(programSchedules.programId, programId),
        eq(programSchedules.weekNumber, templateWeek),
        eq(programSchedules.dayOfWeek, dayOfWeek)
      )
    );
}

export async function deleteScheduleEntry(
  scheduleId: string
): Promise<boolean> {
  const result = await db
    .delete(programSchedules)
    .where(eq(programSchedules.id, scheduleId))
    .returning({ id: programSchedules.id });
  return result.length > 0;
}

// Hapus seluruh schedule untuk satu minggu template
export async function deleteScheduleWeek(
  programId: string,
  weekNumber: number
): Promise<boolean> {
  const result = await db
    .delete(programSchedules)
    .where(
      and(
        eq(programSchedules.programId, programId),
        eq(programSchedules.weekNumber, weekNumber)
      )
    ).returning({ id: programSchedules.id });
  return result.length > 0;
}
