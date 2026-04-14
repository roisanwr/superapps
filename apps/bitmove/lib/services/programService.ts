import { db } from "@/lib/db";
import {
  trainingPrograms,
  programSchedules,
  exerciseLibrary,
  tierEnum,
} from "@woilaa/db-bitmove";
import { eq, and } from "drizzle-orm";

// Gunakan type dari Drizzle schema
export type TierEnum = (typeof tierEnum.enumValues)[number];

export interface ScheduleSlot {
  exerciseId: string;
  weekNumber: number;
  dayOfWeek: number;
  targetTier: TierEnum;
  notes?: string;
}

export interface CreateProgramInput {
  title: string;
  totalWeeks: number;
  slots: ScheduleSlot[];
}

/**
 * Membuat program baru dan langsung mengaktifkannya.
 * Program lama akan di-nonaktifkan otomatis.
 */
export async function createAndActivateProgram(
  userId: string,
  input: CreateProgramInput
) {
  return db.transaction(async (tx) => {
    // 1. Nonaktifkan semua program aktif user yang lama
    await tx
      .update(trainingPrograms)
      .set({ isActive: false })
      .where(and(eq(trainingPrograms.userId, userId), eq(trainingPrograms.isActive, true)));

    // 2. Buat program baru
    const [program] = await tx
      .insert(trainingPrograms)
      .values({
        userId,
        title: input.title,
        totalWeeks: input.totalWeeks,
        isActive: true,
        startDate: new Date().toISOString().split("T")[0],
      })
      .returning();

    // 3. Buat semua slot jadwal
    if (input.slots.length > 0) {
      await tx.insert(programSchedules).values(
        input.slots.map((slot) => ({
          programId: program.id,
          weekNumber: slot.weekNumber,
          dayOfWeek: slot.dayOfWeek,
          exerciseId: slot.exerciseId,
          targetTier: slot.targetTier,
          notes: slot.notes ?? null,
        }))
      );
    }

    return program;
  });
}

export async function updateAndActivateProgram(
  programId: string,
  userId: string,
  input: CreateProgramInput
) {
  return db.transaction(async (tx) => {
    // 1. Nonaktifkan semua program aktif user yang lama
    await tx
      .update(trainingPrograms)
      .set({ isActive: false })
      .where(and(eq(trainingPrograms.userId, userId), eq(trainingPrograms.isActive, true)));

    // 2. Update program yang dipilih
    const [program] = await tx
      .update(trainingPrograms)
      .set({
        title: input.title,
        totalWeeks: input.totalWeeks,
        isActive: true,
      })
      .where(and(eq(trainingPrograms.id, programId), eq(trainingPrograms.userId, userId)))
      .returning();

    // 3. Hapus schedule lama
    await tx
      .delete(programSchedules)
      .where(eq(programSchedules.programId, programId));

    // 4. Buat semua slot jadwal baru
    if (input.slots.length > 0) {
      await tx.insert(programSchedules).values(
        input.slots.map((slot) => ({
          programId: program.id,
          weekNumber: slot.weekNumber,
          dayOfWeek: slot.dayOfWeek,
          exerciseId: slot.exerciseId,
          targetTier: slot.targetTier,
          notes: slot.notes ?? null,
        }))
      );
    }

    return program;
  });
}

export async function activateProgram(programId: string, userId: string) {
  return db.transaction(async (tx) => {
    await tx
      .update(trainingPrograms)
      .set({ isActive: false })
      .where(and(eq(trainingPrograms.userId, userId), eq(trainingPrograms.isActive, true)));

    const [program] = await tx
      .update(trainingPrograms)
      .set({ isActive: true })
      .where(and(eq(trainingPrograms.id, programId), eq(trainingPrograms.userId, userId)))
      .returning();

    return program;
  });
}

/** Ambil semua program milik user, include jadwal + info exercise */
export async function getProgramsForUser(userId: string) {
  return db.query.trainingPrograms.findMany({
    where: eq(trainingPrograms.userId, userId),
    with: {
      schedules: {
        with: {
          exercise: {
            columns: { name: true, scaleType: true },
          },
        },
      },
    },
    orderBy: (tp, { desc }) => [desc(tp.createdAt)],
  });
}

/** Hapus satu program beserta semua schedule-nya (cascade di DB) */
export async function deleteProgram(programId: string, userId: string) {
  const [deleted] = await db
    .delete(trainingPrograms)
    .where(and(eq(trainingPrograms.id, programId), eq(trainingPrograms.userId, userId)))
    .returning();
  return deleted;
}

/** Ambil satu program spesifik beserta jadwalnya */
export async function getProgramById(programId: string, userId: string) {
  return db.query.trainingPrograms.findFirst({
    where: and(
      eq(trainingPrograms.id, programId),
      eq(trainingPrograms.userId, userId)
    ),
    with: {
      schedules: {
        with: {
          exercise: {
            columns: { name: true, scaleType: true },
          },
        },
      },
    },
  });
}
