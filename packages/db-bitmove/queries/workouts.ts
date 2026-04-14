import { eq, and, desc } from "drizzle-orm";
import { db } from "../client";
import {
  workouts,
  workoutExercises,
  sets,
  exerciseLibrary,
  difficultyScales,
  tierRewards,
  pointLogs,
  profiles,
  type Workout,
  type NewWorkout,
  type WorkoutExercise,
  type NewWorkoutExercise,
  type Set,
  type NewSet,
  type ExerciseLibrary,
} from "../schema/schema";

// =============================================================================
// workouts.ts — CRUD untuk workout, workout_exercises, sets, exercise_library
// Tier assignment dilakukan di app layer sebelum insert set.
// =============================================================================

// -----------------------------------------------------------------------------
// EXERCISE LIBRARY
// -----------------------------------------------------------------------------

export async function getAllExercises(): Promise<ExerciseLibrary[]> {
  return db
    .select()
    .from(exerciseLibrary)
    .where(eq(exerciseLibrary.isArchived, false));
}

// Ambil exercise + difficulty scales sekaligus untuk tier lookup di app layer
export async function getExerciseWithScales(exerciseId: string) {
  const exercise = await db
    .select()
    .from(exerciseLibrary)
    .where(eq(exerciseLibrary.id, exerciseId));

  if (!exercise[0]) return null;

  const scales = await db
    .select()
    .from(difficultyScales)
    .where(eq(difficultyScales.scaleType, exercise[0].scaleType))
    .orderBy(difficultyScales.tier);

  return { exercise: exercise[0], scales };
}

// Custom exercise buatan user
export async function createCustomExercise(
  userId: string,
  data: Omit<typeof exerciseLibrary.$inferInsert, "id" | "createdBy" | "isArchived">
): Promise<ExerciseLibrary> {
  const [exercise] = await db
    .insert(exerciseLibrary)
    .values({ ...data, createdBy: userId })
    .returning();
  return exercise;
}

// Archive exercise custom (soft delete)
export async function archiveExercise(
  exerciseId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(exerciseLibrary)
    .set({ isArchived: true })
    .where(
      and(
        eq(exerciseLibrary.id, exerciseId),
        eq(exerciseLibrary.createdBy, userId)
      )
    ).returning({ id: exerciseLibrary.id });
  return result.length > 0;
}

// -----------------------------------------------------------------------------
// WORKOUT SESSION
// -----------------------------------------------------------------------------

// Mulai sesi workout baru
export async function startWorkout(userId: string, notes?: string): Promise<Workout> {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, notes, status: "IN_PROGRESS" })
    .returning();
  return workout;
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id));
  return workout ?? null;
}

export async function getWorkoutsByUser(userId: string): Promise<Workout[]> {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt));
}

// Complete workout — hitung total XP/points dari semua set di sesi ini
export async function completeWorkout(workoutId: string): Promise<Workout | null> {
  // Ambil total XP dan points dari point_logs yang reference workout ini
  // (sudah diinsert oleh app layer saat setiap set selesai)
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId));

  if (!workout) return null;

  const [updated] = await db
    .update(workouts)
    .set({
      status: "COMPLETED",
      endedAt: new Date(),
    })
    .where(eq(workouts.id, workoutId))
    .returning();

  return updated ?? null;
}

// -----------------------------------------------------------------------------
// WORKOUT EXERCISES (junction)
// -----------------------------------------------------------------------------

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  notes?: string
): Promise<WorkoutExercise> {
  const [we] = await db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId, notes })
    .returning();
  return we;
}

export async function getWorkoutExercises(
  workoutId: string
): Promise<WorkoutExercise[]> {
  return db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));
}

// -----------------------------------------------------------------------------
// SETS
// Tier di-assign app layer sebelum insert.
// Flow app layer:
//   1. User input completed_value
//   2. App lookup difficulty_scales → cari tier tertinggi yang dicapai
//   3. App lookup tier_rewards → ambil xp_reward + points_reward
//   4. App insert point_logs dengan streak multiplier
//   5. App insert set dengan tier yang sudah dihitung
// weight_kg disimpan tapi default hidden di frontend.
// -----------------------------------------------------------------------------

export async function addSet(
  workoutExerciseId: string,
  data: {
    setNumber: number;
    tier: Set["tier"];        // Sudah dihitung di app layer
    targetValue: number;
    completedValue: number;
    weightKg?: number;
  }
): Promise<Set> {
  const [set] = await db
    .insert(sets)
    .values({
      workoutExerciseId,
      ...data,
      isCompleted: true,
    })
    .returning();
  return set;
}

export async function getSetsByWorkoutExercise(
  workoutExerciseId: string
): Promise<Set[]> {
  return db
    .select()
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId));
}

// -----------------------------------------------------------------------------
// TIER LOOKUP HELPERS
// Dipakai app layer untuk determine tier dari completed_value.
// -----------------------------------------------------------------------------

// Ambil semua tier rewards (untuk kalkulasi reward di app layer)
export async function getTierRewards() {
  return db.select().from(tierRewards);
}

// Ambil difficulty scales untuk satu scale_type
// App layer gunakan ini untuk cari tier tertinggi yang completed_value >= target
export async function getDifficultyScales(
  scaleType: ExerciseLibrary["scaleType"]
) {
  return db
    .select()
    .from(difficultyScales)
    .where(eq(difficultyScales.scaleType, scaleType))
    .orderBy(difficultyScales.tier);
}
