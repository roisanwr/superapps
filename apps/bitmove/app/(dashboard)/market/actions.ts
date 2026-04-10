"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client" // <-- Ini yang tadi ketinggalan bro

export async function createReward(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const price = parseInt(formData.get("price") as string) || 0;

  if (!title || price <= 0) return { error: "Invalid parameters" };

  await prisma.rewards.create({
    data: {
      user_id: session.user.id,
      title,
      price
    }
  });

  revalidatePath("/market");
}

export async function redeemReward(rewardId: string, price: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Get user to check points
    const user = await tx.profiles.findUnique({ where: { id: userId } });
    if (!user || (user.current_points || 0) < price) {
      throw new Error("Insufficient points");
    }

    // 2. We use point_logs to subtract points. 
    //    The trigger process_game_stats automatically updates the profiles.current_points!
    //    Actually, wait... if `xp_change` and `points_change` are negative, the trigger handles it?
    //    Let's check `db.sql`: SET current_points = current_points + NEW.points_change. 
    //    Yes, negative NEW.points_change will subtract it correctly.
    await tx.point_logs.create({
      data: {
        user_id: userId,
        xp_change: 0,
        points_change: -Math.abs(price),
        source_type: "Reward Redemption",
        description: `Redeemed reward ${rewardId}`
      }
    });

    // Option: If we want the reward to disappear after used 1x
    // await tx.rewards.update({
    //   where: { id: rewardId },
    //   data: { is_redeemed: true }
    // });
  });

  revalidatePath("/market");
  revalidatePath("/");
}

export async function deleteReward(rewardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.rewards.delete({
    where: { id: rewardId, user_id: session.user.id }
  });

  revalidatePath("/market");
}