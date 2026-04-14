import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pointLogs } from "@woilaa/db-bitmove";
import { eq, desc } from "drizzle-orm";
import MissionLogTable from "@/components/dashboard/MissionLogTable";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { getAnalyticsData } from "./actions";

export const metadata = {
  title: "MISSION LOG | BITMOVE",
};

export default async function MissionLogPage() {
  const user = await requireUser().catch(() => null);

  if (!user?.sub) {
    redirect("/login");
  }

  // Fetch logs & analytics in parallel
  const [logsList, analyticsData] = await Promise.all([
    db.query.pointLogs.findMany({
      where: eq(pointLogs.userId, user.sub),
      orderBy: [desc(pointLogs.createdAt)],
      limit: 100,
    }),
    getAnalyticsData("30D"),
  ]);

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          MISSION LOG
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
          TRANSACTION ARCHIVES: XP GAINS, PENALTIES &amp; ACTIVITY ANALYTICS.
        </p>
      </div>

      {/* Analytics Dashboard — di atas log table */}
      <AnalyticsDashboard initialData={analyticsData} />

      {/* Log Table */}
      <div className="bg-surface-container border border-outline-variant/30 overflow-hidden">
        {logsList.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant font-headline uppercase tracking-widest text-sm border-b-2 border-primary border-dashed">
            NO TRANSACTION RECORDS FOUND.
          </div>
        ) : (
          <MissionLogTable logs={logsList as any} />
        )}
      </div>
    </div>
  );
}
