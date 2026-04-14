"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { 
  workouts, 
  workoutExercises, 
  sets, 
  tierRewards, 
  difficultyScales, 
  pointLogs, 
  exerciseLibrary 
} from "@woilaa/db-bitmove";
import { eq, and } from "drizzle-orm";

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  await db.insert(workoutExercises).values({
    workoutId,
    exerciseId,
  });

  revalidatePath("/training");
}

export async function logSet(
  workoutExerciseId: string,
  weightKg: number,
  completedValue: number
) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  // Hitung set number berikutnya secara otomatis
  const existingSets = await db.query.sets.findMany({
    where: eq(sets.workoutExerciseId, workoutExerciseId)
  });
  const existingSetsCount = existingSets.length;
  const nextSetNum = existingSetsCount + 1;

  await db.insert(sets).values({
    workoutExerciseId,
    setNumber: nextSetNum,
    weightKg,
    completedValue,
    targetValue: 0, // Dummy value, validasi schema
    tier: "C", // Dummy value, XP dihitung di finishWorkout berdasarkan akumulasi
    isCompleted: true,
  });

  revalidatePath("/training");
}

export async function finishWorkout(workoutId: string) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const userId = user.sub;

  await db.transaction(async (tx) => {
    const workout = await tx.query.workouts.findFirst({
      where: eq(workouts.id, workoutId),
      with: {
        exercises: {
          with: { 
            sets: true,
            exercise: true 
          }
        }
      }
    });

    if (!workout) return;

    // Ambil semua reward dan list scale
    const tierRewardsList = await tx.query.tierRewards.findMany();
    const rewardMap: Record<string, any> = Object.fromEntries(tierRewardsList.map((r) => [r.tier, r]));
    const diffScales = await tx.query.difficultyScales.findMany();

    let totalXp = 0;
    let totalPoints = 0;

    for (const we of workout.exercises) {
      if (we.sets.length === 0) continue;

      // Kumpulkan total volume reps/waktu
      const totalReps = we.sets.reduce((sum, s) => sum + (s.completedValue || 0), 0);
      
      // Ambil scales untuk tipe exercise ini, urutkan dari nilai terkecil
      if (!we.exercise) continue;
      const scales = diffScales
        .filter(s => s.scaleType === we.exercise!.scaleType)
        .sort((a, b) => a.targetValue - b.targetValue);

      // Cari tier maksimal yang dicapai
      let achievedTier = null;
      for (const scale of scales) {
        if (totalReps >= scale.targetValue) {
          achievedTier = scale.tier;
        } else {
          break; // Kalau gak sampe target selanjutnya, stop
        }
      }

      // Berikan reward berdasarkan tier maksimal tersebut (1x hadiah per gerakan)
      if (achievedTier) {
        const reward = rewardMap[achievedTier];
        if (reward) {
          totalXp += reward.xpReward || 0;
          totalPoints += reward.pointsReward || 0;
        }
      }
    }

    await tx.update(workouts).set({
      status: "completed",
      endedAt: new Date(),
      totalXpEarned: totalXp,
      totalPointsEarned: totalPoints,
    }).where(eq(workouts.id, workoutId));

    if (totalXp > 0) {
      await tx.insert(pointLogs).values({
        userId,
        xpChange: totalXp,
        pointsChange: totalPoints,
        sourceType: "Training Session",
        description: `Completed Training Session`,
      });
    }
  });

  revalidatePath("/training");
  revalidatePath("/");
}

export async function createExercise(formData: FormData) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const muscle = formData.get("muscle") as string;
  const unit = formData.get("unit") as string || "reps";
  const scaleType = formData.get("scale_type") as string || "strength";

  if (!name) return;

  await db.insert(exerciseLibrary).values({
    name,
    targetMuscle: muscle,
    scaleType: scaleType as any,
    measurementUnit: unit,
    createdBy: user.sub
  });

  revalidatePath("/training");
  revalidatePath("/training/library");
}

/** Buat workout baru dari jadwal hari ini (pre-populate exercise dari program) */
export async function startWorkoutFromPlan(scheduleExerciseIds: string[]) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const userId = user.sub;

  const newWorkoutRecord = await db.insert(workouts).values({
    userId,
    status: "in_progress",
  }).returning({ id: workouts.id });

  const workoutId = newWorkoutRecord[0].id;

  if (scheduleExerciseIds.length > 0) {
    const recordsToInsert = scheduleExerciseIds.map((exerciseId) => ({
      workoutId,
      exerciseId,
    }));
    await db.insert(workoutExercises).values(recordsToInsert);
  }

  revalidatePath("/training");
}

/** Buat workout kosong (ad-hoc, tanpa jadwal) */
export async function startEmptyWorkout() {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  await db.insert(workouts).values({
    userId: user.sub,
    status: "in_progress",
  });

  revalidatePath("/training");
}