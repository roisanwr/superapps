import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { QuickQuests } from "@/components/dashboard/QuickQuests";
import { DisciplineQuota } from "@/components/dashboard/DisciplineQuota";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { MissionLog } from "@/components/dashboard/MissionLog";

export const metadata = {
  title: "COMMAND CENTER | BITMOVE",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/login");
  const userId = session.user.id;

  // 1. Fetch Profile Data
  const profile = await prisma.profiles.findUnique({
    where: { id: userId }
  });
  if (!profile) return redirect("/login");

  // Get Rank Title based on Level
  const levelRule = await prisma.level_rules.findFirst({
    where: { level: { lte: profile.level ?? 1 } },
    orderBy: { level: "desc" }
  });
  const rankTitle = levelRule?.title || "OPERATIVE";

  // 2. Fetch Tasks for Quick Quests & Quota
  const allDailyTasks = await prisma.tasks.findMany({
    where: { user_id: userId, frequency: "Daily" }
  });

  const completedCount = allDailyTasks.filter(t => t.is_completed).length;
  const totalCount = allDailyTasks.length;
  const quotaPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Top 3 Priority Uncompleted Quests
  const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const quickQuests = allDailyTasks
    .filter(t => !t.is_completed)
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
  const recentLogs = await prisma.point_logs.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 5
  });

  // Calculate local time for logs
  const logs = recentLogs.map(l => {
    const d = l.created_at ? new Date(l.created_at) : new Date();
    // Sangat penting format time, fallback ke format hh:mm:ss
    const timeStr = d.toLocaleTimeString("en-US", { hour12: false, timeZone: profile.timezone || "Asia/Jakarta" });
    return {
      id: l.id,
      time: timeStr,
      action: l.description || "Unknown Action",
      yield: `${l.xp_change && l.xp_change > 0 ? '+' : ''}${l.xp_change || 0} XP`,
      isPenalty: l.xp_change && l.xp_change < 0 ? true : false,
      sourceType: l.source_type
    };
  });

  // 4. Heatmap Activity Data (364 Days)
  // Get all point logs grouped by date in the last year
  // (We'll do a simple fetch of logs in the last 364 days and aggregate by date string here)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 364);
  
  const allLogsYear = await prisma.point_logs.findMany({
    where: { 
      user_id: userId,
      created_at: { gte: oneYearAgo }
    },
    select: { created_at: true }
  });

  // Count by date string "YYYY-MM-DD"
  const activityMap: Record<string, number> = {};
  allLogsYear.forEach(l => {
    if (!l.created_at) return;
    const dStr = new Date(l.created_at).toISOString().split('T')[0];
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <HeroSection 
            xp={profile.current_xp || 0} 
            streak={profile.streak_current || 0} 
            level={profile.level || 1}
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
          streakMax={profile.streak_max || 0}
        />
      </section>

      <section>
        <MissionLog logs={logs} credits={profile.current_points || 0} />
      </section>
    </div>
  );
}
