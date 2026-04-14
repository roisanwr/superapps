"use server"

import { requireUser } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { tasks, pointLogs, profiles, taskLibrary } from "@woilaa/db-bitmove"
import { eq, and, sql } from "drizzle-orm"

export async function toggleTask(
  taskId: string,
  isCompleted: boolean,
  priority: string = "Medium",
  polarity: string = "POSITIVE"
) {
  const user = await requireUser();
  const userId = user.sub;

  if (isCompleted) {
    // Undo — un-complete task (dev utility)
    await db.update(tasks)
      .set({ isCompleted: false })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  } else if (polarity === "NEGATIVE") {
    // Task negatif: user menekan = melanggar pantangan → PENALTI
    const xpPenalty  = priority === "High" ? -200 : priority === "Medium" ? -100 : -50;
    const ptsPenalty = priority === "High" ? -100 : priority === "Medium" ? -50  : -25;

    await db.transaction(async (tx) => {
      // 1. Tandai sudah dilanggar hari ini
      await tx.update(tasks)
        .set({
          isCompleted: true,
          lastCompletedAt: new Date(),
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

      // 2. Catat penalti di point_logs (nilai negatif)
      await tx.insert(pointLogs).values({
        userId,
        xpChange: xpPenalty,
        pointsChange: ptsPenalty,
        sourceType: "punishment",
        description: `Violated forbidden task — ID: ${taskId}`,
      });

      // 3. Update profil langsung (kurangi XP & Points, minimum 0)
      await tx.execute(sql`
        UPDATE profiles
        SET
          current_xp     = GREATEST(0, current_xp + ${xpPenalty}),
          current_points = GREATEST(0, current_points + ${ptsPenalty}),
          updated_at     = NOW()
        WHERE user_id = ${userId}::uuid
      `);
    });
  } else {
    // Task positif: tandai selesai → dapat reward XP via DB trigger
    await db.transaction(async (tx) => {
      await tx.update(tasks)
        .set({
          isCompleted: true,
          lastCompletedAt: new Date(),
          currentValue: 1
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    });
  }

  revalidatePath("/quests");
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const userId = user.sub;

  const title    = formData.get("title") as string;
  const category = (formData.get("category") as string) || "General";
  const priority = (formData.get("priority") as any) || "Medium";
  const frequency = (formData.get("frequency") as any) || "Daily";
  const polarity  = (formData.get("polarity") as string) || "POSITIVE";

  if (!title) return { error: "Title is required" };

  await db.insert(tasks).values({
    userId,
    title,
    category,
    priority,
    frequency,
    polarity,
    targetValue: 1,
    currentValue: 0
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function createTaskFromLibrary(libraryId: string) {
  const user = await requireUser();
  const userId = user.sub;

  const template = await db.query.taskLibrary.findFirst({
    where: eq(taskLibrary.id, libraryId)
  });

  if (!template) return { error: "Template not found" };

  // Cek apakah task dengan judul yang sama sudah ada
  const duplicate = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.userId, userId),
      eq(tasks.title, template.title)
    )
  });

  if (duplicate) return { error: "Task sudah ada di daftar kamu" };

  await db.insert(tasks).values({
    userId,
    title: template.title,
    category: template.category,
    priority: template.defaultPriority ?? "Medium",
    frequency: template.defaultFrequency ?? "Daily",
    targetValue: template.defaultTargetValue ?? 1,
    unit: template.defaultUnit ?? "Checklist",
    polarity: template.polarity ?? "POSITIVE",
    currentValue: 0,
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const userId = user.sub;

  await db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/quests");
}