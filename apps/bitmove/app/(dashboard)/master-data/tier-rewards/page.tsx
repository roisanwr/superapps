import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TierRewardsClient from "./TierRewardsClient";

export const metadata = {
  title: "TIER REWARDS | MASTER DATA | BITMOVE",
};

export default async function TierRewardsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all tier rewards
  const rewards = await prisma.tier_rewards.findMany({
    orderBy: { tier: "asc" }
  });

  return <TierRewardsClient initialData={rewards} />;
}
