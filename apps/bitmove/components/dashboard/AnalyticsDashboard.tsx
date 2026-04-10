"use client";

import { useState, useTransition } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Zap, ShieldAlert, Trophy, Star } from "lucide-react";
import { getAnalyticsData, type TimeRange, type AnalyticsData } from "@/app/(dashboard)/mission-log/actions";

type Props = {
  initialData: AnalyticsData;
};

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1D", value: "1D" },
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
  { label: "90D", value: "90D" },
  { label: "1Y", value: "1Y" },
];

// ── Custom tooltip for AreaChart ─────────────────────────────────────────────
function XpTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121212] border border-[#8eff71]/30 px-4 py-3 shadow-[0_0_20px_rgba(142,255,113,0.15)]">
      <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </p>
      <p className="font-headline font-black text-sm text-[#8eff71]">
        +{payload[0]?.value ?? 0} XP
      </p>
      <p className="font-body text-[10px] text-on-surface-variant mt-0.5">
        Cumulative: {payload[1]?.value ?? 0} XP
      </p>
    </div>
  );
}

// ── Custom tooltip for BarChart ───────────────────────────────────────────────
function ActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const colorMap: Record<string, string> = {
    quest: "#8eff71",
    training: "#e8d44d",
    penalty: "#ff4444",
    other: "#666",
  };

  return (
    <div className="bg-[#121212] border border-outline-variant/30 px-4 py-3 shadow-xl min-w-[140px]">
      <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs font-headline font-bold">
          <span style={{ color: colorMap[entry.dataKey] ?? "#888" }} className="uppercase">
            {entry.dataKey}
          </span>
          <span className="text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton for loading state ────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="w-full h-48 bg-surface-container-high animate-pulse flex items-end gap-1 px-6 pb-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/10 rounded-sm"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className={`bg-surface-container p-5 border-t-2 flex flex-col gap-2`} style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <span className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="font-headline font-black text-2xl text-white">{value}</div>
      {sub && (
        <div className="font-body text-[10px] text-on-surface-variant">{sub}</div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AnalyticsDashboard({ initialData }: Props) {
  const [activeRange, setActiveRange] = useState<TimeRange>("30D");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  );
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();

  // Filter state for Activity Breakdown Bar Chart
  const [filters, setFilters] = useState<Record<string, boolean>>({
    quest: true,
    training: true,
    penalty: true,
    other: true,
  });

  const toggleFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRangeChange = (range: TimeRange) => {
    if (range === activeRange) return;
    setActiveRange(range);
    startTransition(async () => {
      const fresh = await getAnalyticsData(range, selectedDate);
      setData(fresh);
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;
    setSelectedDate(newDate);
    startTransition(async () => {
      const fresh = await getAnalyticsData("1D", newDate);
      setData(fresh);
    });
  };

  const { stats, xpTimeline, activityBreakdown } = data;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-outline-variant/20">
        <div>
          <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            OPERATION ANALYTICS
          </h2>
          <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
            PERFORMANCE METRICS &amp; ACTIVITY BREAKDOWN
          </p>
        </div>

        {/* Range filter */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {activeRange === "1D" && (
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              disabled={isPending}
              className="bg-surface-container-high border border-outline-variant/30 text-white font-headline text-xs px-3 py-2 focus:outline-none focus:border-primary disabled:opacity-50"
            />
          )}
          <div className="flex items-center border border-outline-variant/30 overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                disabled={isPending}
                className={`px-4 py-2 font-headline font-black text-xs uppercase tracking-widest transition-all border-r border-outline-variant/30 last:border-r-0 ${
                  activeRange === r.value
                    ? "bg-primary text-black"
                    : "text-on-surface-variant hover:text-white hover:bg-surface-container-high"
                } disabled:opacity-50`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total XP Earned"
            value={`+${stats.totalXp.toLocaleString()}`}
            sub={`~${stats.avgXpPerDay} XP/day avg`}
            icon={Zap}
            color="#8eff71"
          />
          <KpiCard
            label="Tasks Completed"
            value={stats.totalTasks.toString()}
            sub="quest completions"
            icon={Trophy}
            color="#e8d44d"
          />
          <KpiCard
            label="Failures & Misses"
            value={stats.totalPenalties.toString()}
            sub={`${stats.missedDays} missed days`}
            icon={ShieldAlert}
            color={stats.totalPenalties === 0 && stats.missedDays === 0 ? "#8eff71" : "#ff4444"}
          />
          <KpiCard
            label="Best Day"
            value={stats.bestDay ? `+${stats.bestDay.xp} XP` : "—"}
            sub={stats.bestDay?.label ?? "no data"}
            icon={Star}
            color="#8eff71"
          />
        </div>

        {/* XP Flow — Area Chart */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary" />
            <h3 className="font-headline font-black text-sm uppercase tracking-widest text-white">
              XP FLOW
            </h3>
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
              — DAILY XP EARNED
            </span>
          </div>

          {isPending ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={xpTimeline} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8eff71" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8eff71" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8d44d" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#e8d44d" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 6" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontFamily: "var(--font-headline, monospace)", fontSize: 10, fill: "#666" }}
                  style={{ textTransform: "uppercase" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontFamily: "var(--font-headline, monospace)", fontSize: 10, fill: "#666" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<XpTooltip />} cursor={{ stroke: "#8eff71", strokeWidth: 1, strokeDasharray: "4 4" }} />

                {/* Cumulative as background context */}
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#e8d44d"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="url(#cumGradient)"
                  dot={false}
                  activeDot={false}
                />

                {/* Daily XP flow — primary + glow */}
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#8eff71"
                  strokeWidth={2}
                  fill="url(#xpGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#8eff71", stroke: "#000", strokeWidth: 2, filter: "url(#glow)" }}
                  filter="url(#glow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center gap-6 mt-3 pl-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#8eff71]" />
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">Daily XP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-t border-dashed border-[#e8d44d]" />
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">Cumulative</span>
            </div>
          </div>
        </div>

        {/* Activity Breakdown — Bar Chart */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-secondary" />
            <h3 className="font-headline font-black text-sm uppercase tracking-widest text-white">
              ACTIVITY BREAKDOWN
            </h3>
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
              — ACTIONS PER SOURCE
            </span>
          </div>

          {isPending ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activityBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 6" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontFamily: "var(--font-headline, monospace)", fontSize: 10, fill: "#666" }}
                  style={{ textTransform: "uppercase" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontFamily: "var(--font-headline, monospace)", fontSize: 10, fill: "#666" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ActivityTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />

                {filters.quest && <Bar dataKey="quest" stackId="a" fill="#8eff71" radius={[0, 0, 0, 0]} maxBarSize={24} />}
                {filters.training && <Bar dataKey="training" stackId="a" fill="#e8d44d" maxBarSize={24} />}
                {filters.other && <Bar dataKey="other" stackId="a" fill="#444" maxBarSize={24} />}
                {filters.penalty && <Bar dataKey="penalty" stackId="a" fill="#ff4444" radius={[2, 2, 0, 0]} maxBarSize={24} />}
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend / Interactive Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pl-1">
            {[
              { key: "quest", label: "Quest / Task", color: "#8eff71" },
              { key: "training", label: "Training", color: "#e8d44d" },
              { key: "penalty", label: "Forbidden Task", color: "#ff4444" },
              { key: "other", label: "Other", color: "#444" },
            ].map((item) => {
              const active = filters[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => toggleFilter(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary/50 text-left ${
                    active 
                      ? "bg-surface-container-high border-transparent shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                      : "bg-transparent border-outline-variant/30 opacity-50 hover:bg-surface-container hover:opacity-100"
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: active ? item.color : "#555" }} />
                  <span className={`font-headline text-[10px] uppercase tracking-widest ${active ? "text-on-surface-variant text-white" : "text-[#777]"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
