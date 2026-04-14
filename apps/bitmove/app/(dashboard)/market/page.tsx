import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles, rewards } from "@woilaa/db-bitmove";
import { eq, desc } from "drizzle-orm";
import { MarketClient } from "./MarketClient";

export const metadata = {
  title: "BLACK MARKET | BITMOVE",
};

export default async function MarketPage() {
  const user = await requireUser().catch(() => null);
  if (!user?.sub) return <div>Unauthorized Access.</div>;

  // Fetch the user's current points
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.sub)
  });

  const rewardsList = await db.query.rewards.findMany({
    where: eq(rewards.userId, user.sub),
    orderBy: [desc(rewards.createdAt)]
  });

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-error glitch-effect">
            BLACK MARKET
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-error/80 mt-2 border-l-2 border-error pl-3">
            TRADE HARD-EARNED POINTS FOR REAL-WORLD PRIVILEGES.
          </p>
        </div>
        
        <div className="bg-surface-container-low border border-outline-variant p-4 text-center min-w-[150px]">
           <span className="block font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">AVAILABLE BALANCE</span>
           <span className="font-headline font-black text-3xl text-primary">{profile?.currentPoints || 0}</span>
        </div>
      </div>

      <MarketClient rewards={rewardsList as any} currentPoints={profile?.currentPoints || 0} />
    </div>
  );
}
