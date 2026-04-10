"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// LEVEL RULES
// ==========================================
export async function saveLevelRule(data: { level: number; min_xp: number; title: string | null }, isEdit: boolean) {
  if (isEdit) {
    await prisma.level_rules.update({
      where: { level: data.level },
      data: { min_xp: data.min_xp, title: data.title },
    });
  } else {
    await prisma.level_rules.create({
      data: { level: data.level, min_xp: data.min_xp, title: data.title },
    });
  }
  revalidatePath("/master-data/level-rules");
}

export async function deleteLevelRule(level: number) {
  await prisma.level_rules.delete({ where: { level } });
  revalidatePath("/master-data/level-rules");
}

// ==========================================
// TASK LIBRARY
// ==========================================
export async function saveTaskLibrary(data: any, id?: string) {
  if (id) {
    await prisma.task_library.update({
      where: { id },
      data,
    });
  } else {
    await prisma.task_library.create({ data });
  }
  revalidatePath("/master-data/task-library");
}

export async function deleteTaskLibrary(id: string) {
  await prisma.task_library.delete({ where: { id } });
  revalidatePath("/master-data/task-library");
}

// ==========================================
// EXERCISE LIBRARY
// ==========================================
export async function saveExerciseLibrary(data: any, id?: string) {
  if (id) {
    await prisma.exercise_library.update({
      where: { id },
      data,
    });
  } else {
    await prisma.exercise_library.create({ data });
  }
  revalidatePath("/master-data/exercise-library");
}

export async function deleteExerciseLibrary(id: string) {
  await prisma.exercise_library.delete({ where: { id } });
  revalidatePath("/master-data/exercise-library");
}

// ==========================================
// DIFFICULTY SCALES
// ==========================================
export async function saveDifficultyScale(data: any, originalKey?: { scale_type: any; tier: any }) {
  if (originalKey) {
    // Prisma doesn't easily let us change part of a composite ID unless we delete/recreate or it's supported by the DB.
    // Easiest is to update if keys match, else delete & create.
    if (originalKey.scale_type === data.scale_type && originalKey.tier === data.tier) {
      await prisma.difficulty_scales.update({
        where: { scale_type_tier: { scale_type: originalKey.scale_type, tier: originalKey.tier } },
        data: { target_value: data.target_value },
      });
    } else {
      await prisma.difficulty_scales.delete({
        where: { scale_type_tier: { scale_type: originalKey.scale_type, tier: originalKey.tier } }
      });
      await prisma.difficulty_scales.create({ data });
    }
  } else {
    await prisma.difficulty_scales.create({ data });
  }
  revalidatePath("/master-data/difficulty-scales");
}

export async function deleteDifficultyScale(scale_type: any, tier: any) {
  await prisma.difficulty_scales.delete({
    where: { scale_type_tier: { scale_type, tier } }
  });
  revalidatePath("/master-data/difficulty-scales");
}

// ==========================================
// TIER REWARDS
// ==========================================
export async function saveTierReward(data: any, isEdit: boolean) {
  if (isEdit) {
    await prisma.tier_rewards.update({
      where: { tier: data.tier },
      data: { xp_reward: data.xp_reward, points_reward: data.points_reward },
    });
  } else {
    await prisma.tier_rewards.create({ data });
  }
  revalidatePath("/master-data/tier-rewards");
}

export async function deleteTierReward(tier: any) {
  await prisma.tier_rewards.delete({ where: { tier } });
  revalidatePath("/master-data/tier-rewards");
}
