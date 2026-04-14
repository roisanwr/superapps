"use server"

import { requireUser } from "@/lib/session"
import { db } from "@/lib/db"
import { rewards, pointLogs, profiles } from "@woilaa/db-bitmove"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createReward(formData: FormData) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const price = parseInt(formData.get("price") as string) || 0;

  if (!title || price <= 0) return { error: "Invalid parameters" };

  await db.insert(rewards).values({
    userId: user.sub,
    title,
    price
  });

  revalidatePath("/market");
}

export async function redeemReward(rewardId: string, price: number) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");
  const userId = user.sub;

  await db.transaction(async (tx) => {
    // 1. Get user to check points
    const profile = await tx.query.profiles.findFirst({
      where: eq(profiles.id, userId)
    });
    
    if (!profile || (profile.currentPoints || 0) < price) {
      throw new Error("Insufficient points");
    }

    // 2. We use pointLogs to subtract points. 
    //    The trigger process_game_stats automatically updates the profiles.current_points!
    //    Actually, wait... if `xp_change` and `points_change` are negative, the trigger handles it?
    //    Let's check `db.sql`: SET current_points = current_points + NEW.points_change. 
    //    Yes, negative NEW.points_change will subtract it correctly.
    await tx.insert(pointLogs).values({
      userId,
      xpChange: 0,
      pointsChange: -Math.abs(price),
      sourceType: "Reward Redemption",
      description: `Redeemed reward ${rewardId}`
    });

    // Option: If we want the reward to disappear after used 1x
    // await tx.update(rewards).set({ isRedeemed: true }).where(eq(rewards.id, rewardId));
  });

  revalidatePath("/market");
  revalidatePath("/");
}

export async function deleteReward(rewardId: string) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  await db.delete(rewards).where(
    and(
      eq(rewards.id, rewardId),
      eq(rewards.userId, user.sub)
    )
  );

  revalidatePath("/market");
}