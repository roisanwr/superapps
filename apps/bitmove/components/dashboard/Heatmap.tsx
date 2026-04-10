"use client";

import { useMemo, useState, useRef } from "react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS = 52;
const CELL_SIZE = 12; // px
const CELL_GAP = 3;  // px

type Cell = {
  isoDate: string;
  dateLabel: string;
  count: number;
  future: boolean;
};

type TooltipState = {
  x: number;
  y: number;
  date: string;
  count: number;
} | null;

/**
 * Returns a CSS background-color style string for a given count.
 * Uses a 5-level dynamic scale relative to the max count in the dataset.
 * Level 0 → empty | Level 1–4 → progressively brighter greens
 */
function getCellStyle(count: number, maxCount: number): React.CSSProperties {
  if (count <= 0) return { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" };

  // Normalise 0–1 relative to the dataset max (floor at 1 so a single action registers)
  const ratio = count / Math.max(maxCount, 1);

  if (ratio <= 0.15)  return { backgroundColor: "#0d3b1f" };
  if (ratio <= 0.35)  return { backgroundColor: "#1a5e33" };
  if (ratio <= 0.60)  return { backgroundColor: "#26874b" };
  if (ratio <= 0.85)  return { backgroundColor: "#39b860" };
  // Top tier — glow effect matching BitMove primary
  return {
    backgroundColor: "#8eff71",
    boxShadow: "0 0 6px rgba(142,255,113,0.55)",
  };
}

function getLegendStyle(level: number): React.CSSProperties {
  const styles = [
    { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" },
    { backgroundColor: "#0d3b1f" },
    { backgroundColor: "#26874b" },
    { backgroundColor: "#39b860" },
    { backgroundColor: "#8eff71", boxShadow: "0 0 5px rgba(142,255,113,0.55)" },
  ];
  return styles[level] ?? styles[0];
}

export function Heatmap({
  activityMap = {},
  streakMax = 0,
}: {
  activityMap?: Record<string, number>;
  streakMax?: number;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { grid, monthLabels, stats, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Anchor: Monday of the current week
    const dow = today.getDay(); // 0=Sun
    const daysToMon = dow === 0 ? 6 : dow - 1;

    // Start: 52 weeks ago from this Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToMon - (WEEKS - 1) * 7);

    // Build WEEKS columns × 7 rows
    const grid: Cell[][] = [];
    const monthLabels: { label: string; weekIdx: number }[] = [];

    let maxCount = 0;
    let totalMisses = 0;
    let totalActions = 0;
    let activeDays = 0;
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);

        if (date > today) {
          col.push({ isoDate: "", dateLabel: "", count: -1, future: true });
          continue;
        }

        const isoDate = date.toISOString().split("T")[0];
        const dateLabel = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const count = activityMap[isoDate] || 0;
        maxCount = Math.max(maxCount, count);
        totalActions += count;
        if (count === 0) totalMisses++;
        else activeDays++;

        // Month label: track where a new month starts (only on Mon row = d===0)
        if (d === 0 && date.getMonth() !== lastMonth) {
          monthLabels.push({ label: MONTH_NAMES[date.getMonth()], weekIdx: w });
          lastMonth = date.getMonth();
        }

        col.push({ isoDate, dateLabel, count, future: false });
      }
      grid.push(col);
    }

    const total = activeDays + totalMisses;
    const compRate = total > 0 ? (activeDays / total).toFixed(2) : "0.00";
    const avgFocus = total > 0 ? Math.min(100, Math.round((totalActions / (total * 5)) * 100)) : 0;

    return { grid, monthLabels, stats: { totalMisses, avgFocus, compRate }, maxCount };
  }, [activityMap]);

  const handleMouseEnter = (cell: Cell, e: React.MouseEvent) => {
    if (cell.future || !cell.isoDate) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      date: cell.dateLabel,
      count: cell.count,
    });
  };

  const totalCellWidth = CELL_SIZE + CELL_GAP;

  return (
    <div className="bg-surface-container p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h2 className="font-headline font-black text-xl uppercase tracking-tighter">DISCIPLINE HEATMAP</h2>
          <p className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">
            ANNUAL CONSISTENCY LOG [YEAR: {new Date().getFullYear()}]
          </p>
        </div>
        {/* Legend — GitHub-style */}
        <div className="flex items-center gap-1.5">
          <span className="font-headline text-[10px] uppercase text-on-surface-variant mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              style={{ ...getLegendStyle(lvl), width: 12, height: 12, borderRadius: 2 }}
            />
          ))}
          <span className="font-headline text-[10px] uppercase text-on-surface-variant ml-1">More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto select-none"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels row */}
        <div className="relative ml-8" style={{ height: 20, marginBottom: 4 }}>
          {monthLabels.map((m) => (
            <span
              key={`${m.label}-${m.weekIdx}`}
              className="absolute font-headline text-[10px] uppercase text-on-surface-variant"
              style={{ left: m.weekIdx * totalCellWidth }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid body: day labels + cells */}
        <div className="flex gap-0">
          {/* Day labels column */}
          <div
            className="flex flex-col shrink-0"
            style={{ gap: CELL_GAP, marginRight: CELL_GAP + 2 }}
          >
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className="font-headline text-[10px] text-on-surface-variant flex items-center"
                style={{
                  height: CELL_SIZE,
                  // Only show Mon, Wed, Fri (indices 0, 2, 4) — others stay invisible for alignment
                  visibility: [0, 2, 4].includes(i) ? "visible" : "hidden",
                  width: 26,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks × Days cells */}
          <div className="flex" style={{ gap: CELL_GAP }}>
            {grid.map((week, wIdx) => (
              <div
                key={wIdx}
                className="flex flex-col"
                style={{ gap: CELL_GAP }}
              >
                {week.map((cell, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: 2,
                      flexShrink: 0,
                      cursor: cell.future || !cell.isoDate ? "default" : "pointer",
                      transition: "transform 0.1s, box-shadow 0.1s",
                      ...(cell.future || !cell.isoDate
                        ? { backgroundColor: "transparent" }
                        : getCellStyle(cell.count, maxCount)),
                    }}
                    onMouseEnter={(e) => handleMouseEnter(cell, e)}
                    onMouseMove={(e) => handleMouseEnter(cell, e)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 bg-surface-container-high border border-outline-variant/50 px-3 py-2 shadow-xl"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 48,
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            <div className="font-headline font-bold text-white text-xs">{tooltip.date}</div>
            <div className="font-body text-[11px] text-on-surface-variant mt-0.5">
              {tooltip.count === 0
                ? "No activity"
                : `${tooltip.count} action${tooltip.count > 1 ? "s" : ""}`}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-surface-container-low p-4 border-t-2 border-primary">
          <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase mb-1">BEST STREAK</div>
          <div className="font-headline font-black text-xl text-primary">{streakMax} DAYS</div>
        </div>
        <div className="bg-surface-container-low p-4 border-t-2 border-error">
          <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase mb-1">TOTAL MISSES</div>
          <div className="font-headline font-black text-xl text-error">{stats.totalMisses} DAYS</div>
        </div>
        <div className="bg-surface-container-low p-4 border-t-2 border-secondary">
          <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase mb-1">AVERAGE FOCUS</div>
          <div className="font-headline font-black text-xl text-secondary">{stats.avgFocus}%</div>
        </div>
        <div className="bg-surface-container-low p-4 border-t-2 border-primary-dim">
          <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase mb-1">COMPLETION RATE</div>
          <div className="font-headline font-black text-xl text-primary-dim">{stats.compRate}</div>
        </div>
      </div>
    </div>
  );
}
