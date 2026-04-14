import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles } from "@woilaa/db-bitmove";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let streak = 0;
  let xp = 0;
  let points = 0;
  let level = 1;
  let username = "Operative";

  if (user?.sub) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.sub),
      columns: { 
        streakDays: true, 
        currentXp: true, 
        currentPoints: true,
        currentLevel: true,
      }
    });
    streak = profile?.streakDays || 0;
    xp = profile?.currentXp || 0;
    points = profile?.currentPoints || 0;
    level = profile?.currentLevel || 1;
    username = user.username || user.name || "Operative";
  }

  return (
    <DashboardShell streak={streak} xp={xp} points={points} level={level} username={username}>
      {children}
    </DashboardShell>
  );
}
