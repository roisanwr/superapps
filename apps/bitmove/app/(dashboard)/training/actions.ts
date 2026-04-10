"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tier_enum, Prisma } from "@prisma/client"; // <-- INI YANG DITAMBAHKAN

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.workout_exercises.create({
    data: {
      workout_id: workoutId,
      exercise_id: exerciseId,
    }
  });

  revalidatePath("/training");
}

export async function logSet(
  workoutExerciseId: string,
  weightKg: number,
  completedValue: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Hitung set number berikutnya secara otomatis
  const existingSetsCount = await prisma.sets.count({
    where: { workout_exercise_id: workoutExerciseId }
  });
  const nextSetNum = existingSetsCount + 1;

  await prisma.sets.create({
    data: {
      workout_exercise_id: workoutExerciseId,
      set_number: nextSetNum,
      weight_kg: weightKg,
      completed_value: completedValue,
      target_value: 0, // Dummy value, validasi schema
      tier: "C", // Dummy value, XP dihitung di finishWorkout berdasarkan akumulasi
      is_completed: true,
    }
  });

  revalidatePath("/training");
}

export async function finishWorkout(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const workout = await tx.workouts.findUnique({
      where: { id: workoutId },
      include: {
        workout_exercises: {
          include: { 
            sets: true,
            exercises: true 
          }
        }
      }
    });

    if (!workout) return;

    // Ambil semua reward dan list scale
    const tierRewards = await tx.tier_rewards.findMany();
    const rewardMap = Object.fromEntries(tierRewards.map((r) => [r.tier, r]));
    const diffScales = await tx.difficulty_scales.findMany();

    let totalXp = 0;
    let totalPoints = 0;

    for (const we of workout.workout_exercises) {
      if (we.sets.length === 0) continue;

      // Kumpulkan total volume reps/waktu
      const totalReps = we.sets.reduce((sum, s) => sum + (s.completed_value || 0), 0);
      
      // Ambil scales untuk tipe exercise ini, urutkan dari nilai terkecil
      const scales = diffScales
        .filter(s => s.scale_type === we.exercises.scale_type)
        .sort((a,b) => a.target_value - b.target_value);

      // Cari tier maksimal yang dicapai
      let achievedTier = null;
      for (const scale of scales) {
        if (totalReps >= scale.target_value) {
          achievedTier = scale.tier;
        } else {
          break; // Kalau gak sampe target selanjutnya, stop
        }
      }

      // Berikan reward berdasarkan tier maksimal tersebut (1x hadiah per gerakan)
      if (achievedTier) {
        const reward = rewardMap[achievedTier];
        if (reward) {
          totalXp += reward.xp_reward;
          totalPoints += reward.points_reward;
        }
      }
    }

    await tx.workouts.update({
      where: { id: workoutId },
      data: {
        status: "completed",
        ended_at: new Date(),
        total_xp_earned: totalXp,
        total_points_earned: totalPoints,
      }
    });

    if (totalXp > 0) {
      await tx.point_logs.create({
        data: {
          user_id: userId,
          xp_change: totalXp,
          points_change: totalPoints,
          source_type: "Training Session",
          description: `Completed Training Session`,
        }
      });
    }
  });

  revalidatePath("/training");
  revalidatePath("/");
}

export async function createExercise(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const muscle = formData.get("muscle") as string;
  const unit = formData.get("unit") as string || "reps";
  const scaleType = formData.get("scale_type") as string || "strength";

  if (!name) return;

  await prisma.exercise_library.create({
    data: {
      name,
      target_muscle: muscle,
      scale_type: scaleType as any,
      measurement_unit: unit,
      created_by: session.user.id
    }
  });

  revalidatePath("/training");
  revalidatePath("/training/library");
}

/** Buat workout baru dari jadwal hari ini (pre-populate exercise dari program) */
export async function startWorkoutFromPlan(scheduleExerciseIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const workout = await prisma.workouts.create({
    data: {
      user_id: userId,
      status: "in_progress",
    },
  });

  if (scheduleExerciseIds.length > 0) {
    await prisma.workout_exercises.createMany({
      data: scheduleExerciseIds.map((exerciseId) => ({
        workout_id: workout.id,
        exercise_id: exerciseId,
      })),
    });
  }

  revalidatePath("/training");
}

/** Buat workout kosong (ad-hoc, tanpa jadwal) */
export async function startEmptyWorkout() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.workouts.create({
    data: {
      user_id: session.user.id,
      status: "in_progress",
    },
  });

  revalidatePath("/training");
}