import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MissionLogTable from "@/components/dashboard/MissionLogTable";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { getAnalyticsData } from "./actions";

export const metadata = {
  title: "MISSION LOG | BITMOVE",
};

export default async function MissionLogPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch logs & analytics in parallel
  const [logs, analyticsData] = await Promise.all([
    prisma.point_logs.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: "desc" },
      take: 100,
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
        {logs.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant font-headline uppercase tracking-widest text-sm border-b-2 border-primary border-dashed">
            NO TRANSACTION RECORDS FOUND.
          </div>
        ) : (
          <MissionLogTable logs={logs} />
        )}
      </div>
    </div>
  );
}
