import prisma from "@/lib/prisma";
import { tier_enum } from "@prisma/client";

export interface ScheduleSlot {
  exerciseId: string;
  weekNumber: number;
  dayOfWeek: number;
  targetTier: tier_enum;
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
  return prisma.$transaction(async (tx) => {
    // 1. Nonaktifkan semua program aktif user yang lama
    await tx.training_programs.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    // 2. Buat program baru
    const program = await tx.training_programs.create({
      data: {
        user_id: userId,
        title: input.title,
        total_weeks: input.totalWeeks,
        is_active: true,
        start_date: new Date(),
      },
    });

    // 3. Buat semua slot jadwal
    if (input.slots.length > 0) {
      await tx.program_schedules.createMany({
        data: input.slots.map((slot) => ({
          program_id: program.id,
          week_number: slot.weekNumber,
          day_of_week: slot.dayOfWeek,
          exercise_id: slot.exerciseId,
          target_tier: slot.targetTier,
          notes: slot.notes ?? null,
        })),
      });
    }

    return program;
  });
}

export async function updateAndActivateProgram(
  programId: string,
  userId: string,
  input: CreateProgramInput
) {
  return prisma.$transaction(async (tx) => {
    // 1. Nonaktifkan semua program aktif user yang lama
    await tx.training_programs.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    // 2. Update program yang dipilih
    const program = await tx.training_programs.update({
      where: { id: programId, user_id: userId },
      data: {
        title: input.title,
        total_weeks: input.totalWeeks,
        is_active: true,
      },
    });

    // 3. Hapus schedule lama
    await tx.program_schedules.deleteMany({
      where: { program_id: programId },
    });

    // 4. Buat semua slot jadwal baru
    if (input.slots.length > 0) {
      await tx.program_schedules.createMany({
        data: input.slots.map((slot) => ({
          program_id: program.id,
          week_number: slot.weekNumber,
          day_of_week: slot.dayOfWeek,
          exercise_id: slot.exerciseId,
          target_tier: slot.targetTier,
          notes: slot.notes ?? null,
        })),
      });
    }

    return program;
  });
}

export async function activateProgram(programId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.training_programs.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    return tx.training_programs.update({
      where: { id: programId, user_id: userId },
      data: { is_active: true },
    });
  });
}

/** Ambil semua program milik user, include jumlah slot per program */
export async function getProgramsForUser(userId: string) {
  return prisma.training_programs.findMany({
    where: { user_id: userId },
    include: {
      program_schedules: {
        include: { exercise_library: { select: { name: true, scale_type: true } } },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

/** Hapus satu program beserta semua schedule-nya (cascade di DB) */
export async function deleteProgram(programId: string, userId: string) {
  return prisma.training_programs.delete({
    where: { id: programId, user_id: userId },
  });
}

/** Ambil satu program spesifik beserta slidenya */
export async function getProgramById(programId: string, userId: string) {
  return prisma.training_programs.findUnique({
    where: { id: programId, user_id: userId },
    include: {
      program_schedules: {
        include: { exercise_library: { select: { name: true, scale_type: true } } },
      },
    },
  });
}
