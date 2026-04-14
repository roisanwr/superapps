"use server";

import { db } from "@/lib/db";
import { levelRules, taskLibrary, exerciseLibrary, difficultyScales, tierRewards } from "@woilaa/db-bitmove";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ==========================================
// LEVEL RULES
// ==========================================
export async function saveLevelRule(data: { level: number; minXp: number; title: string | null }, isEdit: boolean) {
  if (isEdit) {
    await db.update(levelRules)
      .set({ minXp: data.minXp, title: data.title })
      .where(eq(levelRules.level, data.level));
  } else {
    await db.insert(levelRules).values(data);
  }
  revalidatePath("/master-data/level-rules");
}

export async function deleteLevelRule(level: number) {
  await db.delete(levelRules).where(eq(levelRules.level, level));
  revalidatePath("/master-data/level-rules");
}

// ==========================================
// TASK LIBRARY
// ==========================================
export async function saveTaskLibrary(data: any, id?: string) {
  if (id) {
    await db.update(taskLibrary).set(data).where(eq(taskLibrary.id, id));
  } else {
    await db.insert(taskLibrary).values(data);
  }
  revalidatePath("/master-data/task-library");
}

export async function deleteTaskLibrary(id: string) {
  await db.delete(taskLibrary).where(eq(taskLibrary.id, id));
  revalidatePath("/master-data/task-library");
}

// ==========================================
// EXERCISE LIBRARY
// ==========================================
export async function saveExerciseLibrary(data: any, id?: string) {
  if (id) {
    await db.update(exerciseLibrary).set(data).where(eq(exerciseLibrary.id, id));
  } else {
    await db.insert(exerciseLibrary).values(data);
  }
  revalidatePath("/master-data/exercise-library");
}

export async function deleteExerciseLibrary(id: string) {
  await db.delete(exerciseLibrary).where(eq(exerciseLibrary.id, id));
  revalidatePath("/master-data/exercise-library");
}

// ==========================================
// DIFFICULTY SCALES
// ==========================================
export async function saveDifficultyScale(data: any, originalKey?: { scaleType: string; tier: string }) {
  if (originalKey) {
    if (originalKey.scaleType === data.scaleType && originalKey.tier === data.tier) {
      await db.update(difficultyScales)
        .set({ targetValue: data.targetValue })
        .where(
          and(
            eq(difficultyScales.scaleType, originalKey.scaleType),
            eq(difficultyScales.tier, originalKey.tier as any)
          )
        );
    } else {
      await db.delete(difficultyScales).where(
        and(
          eq(difficultyScales.scaleType, originalKey.scaleType),
          eq(difficultyScales.tier, originalKey.tier as any)
        )
      );
      await db.insert(difficultyScales).values(data);
    }
  } else {
    await db.insert(difficultyScales).values(data);
  }
  revalidatePath("/master-data/difficulty-scales");
}

export async function deleteDifficultyScale(scaleType: string, tier: string) {
  await db.delete(difficultyScales).where(
    and(
      eq(difficultyScales.scaleType, scaleType),
      eq(difficultyScales.tier, tier as any)
    )
  );
  revalidatePath("/master-data/difficulty-scales");
}

// ==========================================
// TIER REWARDS
// ==========================================
export async function saveTierReward(data: any, isEdit: boolean) {
  if (isEdit) {
    await db.update(tierRewards)
      .set({ xpReward: data.xpReward, pointsReward: data.pointsReward })
      .where(eq(tierRewards.tier, data.tier));
  } else {
    await db.insert(tierRewards).values(data);
  }
  revalidatePath("/master-data/tier-rewards");
}

export async function deleteTierReward(tier: string) {
  await db.delete(tierRewards).where(eq(tierRewards.tier, tier as any));
  revalidatePath("/master-data/tier-rewards");
}
