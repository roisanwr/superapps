import { eq, and, isNull, lte, sql } from "drizzle-orm";
import { db } from "../client";
import {
  goals,
  assets,
  type NewGoal,
  type Goal,
  type Asset,
} from "../schema/schema";

// ==========================================
// CREATE
// ==========================================

/**
 * Buat goal baru
 * Goal bisa berupa:
 * - Target uang (targetAmount) — tanpa assetId
 * - Target kepemilikan aset (targetAssetUnits) — dengan assetId
 */
export async function createGoal(
  userId: string,
  data: Omit<NewGoal, "id" | "userId" | "createdAt" | "updatedAt" | "currentAmount" | "currentAssetUnits">
): Promise<Goal> {
  // Validasi: kalau ada assetId, targetAssetUnits wajib diisi
  if (data.assetId && !data.targetAssetUnits) {
    throw new Error("targetAssetUnits wajib diisi jika goal berbasis aset");
  }

  const [goal] = await db
    .insert(goals)
    .values({
      ...data,
      userId,
      currentAmount: "0",
      currentAssetUnits: data.assetId ? "0" : null,
    })
    .returning();
  return goal;
}

// ==========================================
// READ
// ==========================================

/**
 * Ambil semua goal milik user
 */
export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(goals.createdAt);
}

/**
 * Ambil satu goal by ID — authorization check
 */
export async function getGoalById(
  goalId: string,
  userId: string
): Promise<Goal | null> {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  return goal ?? null;
}

/**
 * Ambil semua goal beserta progress dan detail aset (jika ada)
 * Dipakai untuk halaman Goals Dashboard
 */
export async function getGoalsWithProgress(userId: string): Promise<
  {
    goal: Goal;
    asset: Asset | null;
    progressPercent: number;
    isCompleted: boolean;
    isOverdue: boolean;
  }[]
> {
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(goals.deadline);

  if (!userGoals.length) return [];

  // Ambil detail aset untuk goal yang berbasis aset
  const assetIds = userGoals
    .filter((g) => g.assetId !== null)
    .map((g) => g.assetId as string);

  const assetMap = new Map<string, Asset>();
  if (assetIds.length) {
    const assetRows = await db
      .select()
      .from(assets)
      .where(
        sql`${assets.id} = ANY(ARRAY[${sql.raw(
          assetIds.map((id) => `'${id}'`).join(",")
        )}]::uuid[])`
      );
    assetRows.forEach((a) => assetMap.set(a.id, a));
  }

  const now = new Date();

  return userGoals.map((goal) => {
    const asset = goal.assetId ? (assetMap.get(goal.assetId) ?? null) : null;

    // Hitung progress berdasarkan tipe goal
    let progressPercent = 0;
    if (goal.assetId && goal.targetAssetUnits) {
      // Goal berbasis aset — progress dari units
      const current = parseFloat(goal.currentAssetUnits ?? "0");
      const target = parseFloat(goal.targetAssetUnits);
      progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    } else {
      // Goal berbasis uang — progress dari amount
      const current = parseFloat(goal.currentAmount ?? "0");
      const target = parseFloat(goal.targetAmount);
      progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    }

    return {
      goal,
      asset,
      progressPercent: parseFloat(progressPercent.toFixed(2)),
      isCompleted: progressPercent >= 100,
      isOverdue: goal.deadline !== null && goal.deadline < now && progressPercent < 100,
    };
  });
}

/**
 * Ambil goal yang mendekati deadline (dalam N hari ke depan)
 * Dipakai untuk notifikasi / reminder
 */
export async function getGoalsNearDeadline(
  userId: string,
  withinDays: number = 30
): Promise<Goal[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);

  return db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        sql`${goals.deadline} IS NOT NULL`,
        sql`${goals.deadline} <= ${futureDate}`,
        sql`${goals.deadline} >= NOW()`,
        // Belum completed — currentAmount < targetAmount
        sql`${goals.currentAmount} < ${goals.targetAmount}`
      )
    )
    .orderBy(goals.deadline);
}

// ==========================================
// UPDATE
// ==========================================

/**
 * Update detail goal (nama, target, deadline)
 */
export async function updateGoal(
  goalId: string,
  userId: string,
  data: Partial<
    Pick<NewGoal, "name" | "targetAmount" | "deadline" | "targetAssetUnits">
  >
): Promise<Goal | null> {
  const [updated] = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();
  return updated ?? null;
}

/**
 * Update progress goal secara manual
 * currentAmount untuk goal uang, currentAssetUnits untuk goal aset
 * Dipanggil dari aplikasi setiap user update progress
 */
export async function updateGoalProgress(
  goalId: string,
  userId: string,
  data: {
    currentAmount?: string;
    currentAssetUnits?: string;
  }
): Promise<Goal | null> {
  if (!data.currentAmount && !data.currentAssetUnits) {
    throw new Error("Minimal satu dari currentAmount atau currentAssetUnits harus diisi");
  }

  const [updated] = await db
    .update(goals)
    .set({
      ...(data.currentAmount && { currentAmount: data.currentAmount }),
      ...(data.currentAssetUnits && { currentAssetUnits: data.currentAssetUnits }),
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();
  return updated ?? null;
}

// ==========================================
// DELETE
// ==========================================

/**
 * Hapus goal (hard delete)
 */
export async function deleteGoal(
  goalId: string,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning({ id: goals.id });
  return !!deleted;
}
