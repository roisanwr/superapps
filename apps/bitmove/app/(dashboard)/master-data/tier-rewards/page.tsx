import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tierRewards } from "@woilaa/db-bitmove";
import { asc } from "drizzle-orm";
import TierRewardsClient from "./TierRewardsClient";

export const metadata = {
  title: "TIER REWARDS | MASTER DATA | BITMOVE",
};

export default async function TierRewardsPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    redirect("/login");
  }

  const rewards = await db.query.tierRewards.findMany({
    orderBy: [asc(tierRewards.tier)]
  });

  return <TierRewardsClient initialData={rewards as any} />;
}
