import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MarketClient } from "./MarketClient";

export const metadata = {
  title: "BLACK MARKET | BITMOVE",
};

export default async function MarketPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized Access.</div>;
  }

  // Fetch the user's current points
  const profile = await prisma.profiles.findUnique({
    where: { id: session.user.id }
  });

  const rewards = await prisma.rewards.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" }
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
           <span className="font-headline font-black text-3xl text-primary">{profile?.current_points || 0}</span>
        </div>
      </div>

      <MarketClient rewards={rewards} currentPoints={profile?.current_points || 0} />
    </div>
  );
}
