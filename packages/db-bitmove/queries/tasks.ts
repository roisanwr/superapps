import { eq, and, inArray } from "drizzle-orm";
import { db } from "../client";
import {
  tasks,
  taskLibrary,
  type Task,
  type NewTask,
  type TaskLibrary,
} from "../schema/schema";

// =============================================================================
// tasks.ts — CRUD untuk tabel tasks dan task_library
// =============================================================================

// -----------------------------------------------------------------------------
// TASK LIBRARY
// -----------------------------------------------------------------------------

// Ambil semua template task (untuk ditampilkan ke user saat mau tambah task)
export async function getAllLibraryTasks(): Promise<TaskLibrary[]> {
  return db.select().from(taskLibrary).orderBy(taskLibrary.category);
}

// Ambil satu template by id
export async function getLibraryTaskById(
  id: string
): Promise<TaskLibrary | null> {
  const [task] = await db
    .select()
    .from(taskLibrary)
    .where(eq(taskLibrary.id, id));
  return task ?? null;
}

// -----------------------------------------------------------------------------
// TASKS — CREATE
// User harus clone dari task_library, tidak bisa buat dari nol.
// app layer yang tentukan completion_pct dan kirim ke trigger via is_completed.
// -----------------------------------------------------------------------------

export async function cloneTaskFromLibrary(
  userId: string,
  libraryId: string,
  overrides?: {
    priority?: Task["priority"];
    frequency?: Task["frequency"];
    targetValue?: number;
    unit?: string;
  }
): Promise<Task | null> {
  // Ambil template dari library
  const template = await getLibraryTaskById(libraryId);
  if (!template) return null;

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      libraryId,
      title: template.title,
      category: template.category,
      priority: overrides?.priority ?? template.defaultPriority,
      frequency: overrides?.frequency ?? template.defaultFrequency,
      taskType: template.defaultTaskType,
      targetValue: overrides?.targetValue ?? template.defaultTargetValue,
      unit: overrides?.unit ?? template.defaultUnit,
      polarity: template.polarity,
      punishmentXp: template.punishmentXp,
      punishmentPoints: template.punishmentPoints,
    })
    .returning();

  return task;
}

// -----------------------------------------------------------------------------
// TASKS — READ
// -----------------------------------------------------------------------------

export async function getTasksByUser(userId: string): Promise<Task[]> {
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function getDailyTasksByUser(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.frequency, "Daily")));
}

export async function getWeeklyTasksByUser(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.frequency, "Weekly")));
}

// OneTime tasks — selalu tersimpan sebagai record, visible/hidden di frontend
export async function getOneTimeTasks(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.frequency, "OneTime")));
}

export async function getTaskById(id: string): Promise<Task | null> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return task ?? null;
}

// -----------------------------------------------------------------------------
// TASKS — COMPLETE / UNDO
// Trigger DB (handle_task_completion) akan otomatis insert ke point_logs.
// Untuk PROGRESS task: app layer hitung completion_pct, set current_value
//   sebelum update is_completed = true.
// Untuk CHECKBOX task: set current_value = target_value sebelum complete.
// Untuk NEGATIVE task: trigger pakai punishment_xp / punishment_points.
// -----------------------------------------------------------------------------

// Complete task — trigger DB handle reward/punishment
export async function completeTask(
  taskId: string,
  currentValue?: number  // Wajib di-pass untuk PROGRESS task
): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task || task.isCompleted) return null;

  const [updated] = await db
    .update(tasks)
    .set({
      // Untuk CHECKBOX: set current_value = target_value
      // Untuk PROGRESS: current_value dari input user
      currentValue: currentValue ?? task.targetValue,
      isCompleted: true,
      lastCompletedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return updated ?? null;
}

// Undo task — trigger DB akan reverse log via reversed_log_id
export async function undoTask(taskId: string): Promise<Task | null> {
  const [updated] = await db
    .update(tasks)
    .set({
      isCompleted: false,
      currentValue: 0,
      lastCompletedAt: null,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.isCompleted, true)))
    .returning();

  return updated ?? null;
}

// -----------------------------------------------------------------------------
// TASKS — DELETE
// -----------------------------------------------------------------------------
export async function deleteTask(taskId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  return result.length > 0;
}
