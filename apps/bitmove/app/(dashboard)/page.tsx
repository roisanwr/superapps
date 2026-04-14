import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles, tasks, pointLogs } from "@woilaa/db-bitmove";
import { eq, and, desc, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { QuickQuests } from "@/components/dashboard/QuickQuests";
import { DisciplineQuota } from "@/components/dashboard/DisciplineQuota";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { MissionLog } from "@/components/dashboard/MissionLog";

export const metadata = {
  title: "COMMAND CENTER | BITMOVE",
};

const getRankTitle = (level: number) => {
  if (level >= 50) return "GRANDMASTER";
  if (level >= 40) return "MASTER";
  if (level >= 30) return "ELITE";
  if (level >= 20) return "VANGUARD";
  if (level >= 10) return "SPECIALIST";
  return "OPERATIVE";
};

export default async function DashboardPage() {
  const user = await requireUser().catch(() => null);
  if (!user?.sub) return redirect("/login");
  const userId = user.sub;

  // 1. Fetch Profile Data
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });
  if (!profile) return redirect("/login");

  // Get Rank Title based on Level
  const rankTitle = getRankTitle(profile.currentLevel);

  // 2. Fetch Tasks for Quick Quests & Quota
  const allDailyTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), eq(tasks.frequency, "Daily"))
  });

  const completedCount = allDailyTasks.filter(t => t.isCompleted).length;
  const totalCount = allDailyTasks.length;
  const quotaPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Top 3 Priority Uncompleted Quests
  const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const quickQuests = allDailyTasks
    .filter(t => !t.isCompleted)
    .sort((a, b) => (priorityOrder[b.priority || "Medium"] || 0) - (priorityOrder[a.priority || "Medium"] || 0))
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      title: t.title,
      priority: (t.priority?.toUpperCase() || "NORMAL") as "OMEGA" | "HIGH" | "NORMAL",
      xpGain: t.priority === "High" ? 150 : t.priority === "Medium" ? 75 : 30,
      completed: false
    }));

  // 3. Fetch Mission Logs (Last 5)
  const recentLogs = await db.query.pointLogs.findMany({
    where: eq(pointLogs.userId, userId),
    orderBy: [desc(pointLogs.createdAt)],
    limit: 5
  });

  // Calculate local time for logs
  const logsList = recentLogs.map(l => {
    const d = l.createdAt ? new Date(l.createdAt) : new Date();
    const timeStr = d.toLocaleTimeString("en-US", { hour12: false, timeZone: profile.timezone || "Asia/Jakarta" });
    return {
      id: l.id,
      time: timeStr,
      action: l.description || "Unknown Action",
      yield: `${l.xpChange && l.xpChange > 0 ? '+' : ''}${l.xpChange || 0} XP`,
      isPenalty: l.xpChange && l.xpChange < 0 ? true : false,
      sourceType: l.sourceType
    };
  });

  // 4. Heatmap Activity Data (364 Days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 364);
  
  const allLogsYear = await db.query.pointLogs.findMany({
    where: and(
      eq(pointLogs.userId, userId),
      gte(pointLogs.createdAt, oneYearAgo)
    ),
    columns: { createdAt: true }
  });

  // Count by date string "YYYY-MM-DD"
  const activityMap: Record<string, number> = {};
  allLogsYear.forEach(l => {
    if (!l.createdAt) return;
    const dStr = new Date(l.createdAt).toISOString().split('T')[0];
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <HeroSection 
            xp={profile.currentXp || 0} 
            streak={profile.streakDays || 0} 
            level={profile.currentLevel || 1}
            rankTitle={rankTitle}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <QuickQuests quests={quickQuests} />
        </div>
      </section>

      <section>
        <DisciplineQuota quota={quotaPercentage} />
      </section>

      <section>
        <Heatmap 
          activityMap={activityMap} 
          streakMax={profile.streakMax || 0}
        />
      </section>

      <section>
        <MissionLog logs={logsList} credits={profile.currentPoints || 0} />
      </section>
    </div>
  );
}
