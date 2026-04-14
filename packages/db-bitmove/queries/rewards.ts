import { eq, and } from "drizzle-orm";
import { db } from "../client";
import {
  rewards,
  profiles,
  type Reward,
  type NewReward,
} from "../schema/schema";

// =============================================================================
// rewards.ts — CRUD untuk tabel rewards
// Validasi saldo points dilakukan di app layer sebelum redeem.
// =============================================================================

export async function createReward(
  userId: string,
  data: {
    title: string;
    price: number;
    description?: string;
    emoji?: string;
  }
): Promise<Reward> {
  const [reward] = await db
    .insert(rewards)
    .values({ userId, ...data })
    .returning();
  return reward;
}

export async function getRewardsByUser(userId: string): Promise<Reward[]> {
  return db
    .select()
    .from(rewards)
    .where(eq(rewards.userId, userId))
    .orderBy(rewards.createdAt);
}

export async function getRewardById(id: string): Promise<Reward | null> {
  const [reward] = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, id));
  return reward ?? null;
}

// Redeem reward: validasi saldo di app layer dulu, baru panggil ini.
// Fungsi ini atomic — potong points + mark redeemed sekaligus dalam transaction.
export async function redeemReward(
  rewardId: string,
  userId: string
): Promise<{ reward: Reward; remainingPoints: number } | null> {
  const reward = await getRewardById(rewardId);
  if (!reward || reward.isRedeemed || reward.userId !== userId) return null;

  return await db.transaction(async (tx) => {
    // Potong points dari profile (floor di 0 dihandle di DB)
    const [updatedProfile] = await tx
      .update(profiles)
      .set({
        currentPoints: profiles.currentPoints,  // trigger di DB yang potong
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    // Mark reward sebagai redeemed
    const [updatedReward] = await tx
      .update(rewards)
      .set({
        isRedeemed: true,
        redeemedAt: new Date(),
      })
      .where(eq(rewards.id, rewardId))
      .returning();

    return {
      reward: updatedReward,
      remainingPoints: updatedProfile.currentPoints,
    };
  });
}

export async function updateReward(
  rewardId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    emoji?: string;
    price?: number;
  }
): Promise<Reward | null> {
  // Tidak bisa edit reward yang sudah diredeemed
  const [updated] = await db
    .update(rewards)
    .set(data)
    .where(
      and(
        eq(rewards.id, rewardId),
        eq(rewards.userId, userId),
        eq(rewards.isRedeemed, false)
      )
    )
    .returning();
  return updated ?? null;
}

export async function deleteReward(
  rewardId: string,
  userId: string
): Promise<boolean> {
  // Tidak bisa delete reward yang sudah diredeemed (biarkan sebagai record)
  const result = await db
    .delete(rewards)
    .where(
      and(
        eq(rewards.id, rewardId),
        eq(rewards.userId, userId),
        eq(rewards.isRedeemed, false)
      )
    ).returning({ id: rewards.id });
  return result.length > 0;
}
