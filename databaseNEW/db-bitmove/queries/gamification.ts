import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "../client";
import {
  pointLogs,
  levelRules,
  tierRewards,
  type PointLog,
  type NewPointLog,
} from "../schema/schema";

// =============================================================================
// gamification.ts — CRUD untuk point_logs, level_rules, tier_rewards
// process_game_stats trigger otomatis update profiles setelah insert point_log.
// =============================================================================

// -----------------------------------------------------------------------------
// POINT LOGS
// Ledger immutable — tidak ada update/delete, hanya insert.
// Undo dilakukan dengan insert log baru (reversed_log_id menunjuk ke original).
// -----------------------------------------------------------------------------

// Dipanggil dari app layer saat workout set selesai (reward dari tier)
// Trigger DB (process_game_stats) akan otomatis update profiles setelah ini.
export async function insertPointLog(
  data: Omit<NewPointLog, "id" | "createdAt">
): Promise<PointLog> {
  const [log] = await db.insert(pointLogs).values(data).returning();
  return log;
}

// Ambil history log user — untuk menampilkan activity feed
export async function getPointLogsByUser(
  userId: string,
  limit: number = 50
): Promise<PointLog[]> {
  return db
    .select()
    .from(pointLogs)
    .where(eq(pointLogs.userId, userId))
    .orderBy(desc(pointLogs.createdAt))
    .limit(limit);
}

// Ambil log berdasarkan reference_id — untuk audit trail task/set tertentu
export async function getLogsByReference(
  referenceId: string
): Promise<PointLog[]> {
  return db
    .select()
    .from(pointLogs)
    .where(eq(pointLogs.referenceId, referenceId))
    .orderBy(desc(pointLogs.createdAt));
}

// Ambil log berdasarkan source type — untuk breakdown rewards/punishments
export async function getLogsBySource(
  userId: string,
  sourceType: PointLog["sourceType"]
): Promise<PointLog[]> {
  return db
    .select()
    .from(pointLogs)
    .where(
      and(
        eq(pointLogs.userId, userId),
        eq(pointLogs.sourceType, sourceType)
      )
    )
    .orderBy(desc(pointLogs.createdAt));
}

// -----------------------------------------------------------------------------
// LEVEL RULES
// Static lookup — di-seed dengan full 1–50 entry.
// Title di-handle di app layer berdasarkan range:
//   Level 1–4   → Newbie
//   Level 5–9   → Beginner
//   Level 10–19 → Rookie
//   Level 20–29 → Dedicated
//   Level 30–39 → Elite
//   Level 40–49 → Master
//   Level 50    → Immortal
// -----------------------------------------------------------------------------

export async function getAllLevelRules() {
  return db.select().from(levelRules).orderBy(levelRules.level);
}

// Cari level dari XP saat ini — dipakai app layer untuk display
// (DB trigger yang handle update level di profiles, ini untuk cross-check)
export async function getLevelFromXp(currentXp: number) {
  const [rule] = await db
    .select()
    .from(levelRules)
    .where(gte(levelRules.minXp, currentXp))
    .orderBy(desc(levelRules.level))
    .limit(1);
  return rule ?? null;
}

// -----------------------------------------------------------------------------
// TIER REWARDS
// Lookup reward XP/points berdasarkan tier yang dicapai.
// Dipanggil app layer sebelum insert point_log untuk workout set.
// -----------------------------------------------------------------------------

export async function getAllTierRewards() {
  return db.select().from(tierRewards);
}

export async function getTierReward(tier: PointLog["sourceType"] | string) {
  const [reward] = await db
    .select()
    .from(tierRewards)
    .where(eq(tierRewards.tier, tier as any));
  return reward ?? null;
}
