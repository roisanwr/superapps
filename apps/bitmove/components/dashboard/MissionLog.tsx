"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { WorkoutRecordModal } from "./WorkoutRecordModal";

type LogEntry = {
  id: string;
  time: string;
  action: string;
  yield: string;
  isPenalty?: boolean;
  sourceType?: string | null;
};

export function MissionLog({ 
  logs = [],
  credits = 0 
}: { 
  logs?: LogEntry[];
  credits?: number;
}) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20 md:pb-0">
      <div className="md:col-span-1 bg-surface-container p-6 border-l-4 border-secondary overflow-hidden group hover:shadow-[0_0_20px_rgba(213,117,255,0.15)] transition-shadow flex flex-col">
        <h3 className="font-headline font-black text-lg uppercase mb-4 group-hover:text-secondary transition-colors flex justify-between items-center">
          <span>BLACK MARKET</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary">{credits} PTS</span>
            <ShoppingCart className="w-5 h-5" />
          </div>
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface-container-low p-3 hover:bg-surface-bright cursor-pointer transition-colors border border-transparent hover:border-secondary/50">
            <span className="font-headline text-xs uppercase text-on-surface-variant group-hover:text-white">XP Multiplier (2h)</span>
            <span className="font-headline font-black text-primary group-hover:scale-110 transition-transform">500 PTS</span>
          </div>
          <div className="flex justify-between items-center bg-surface-container-low p-3 hover:bg-surface-bright cursor-pointer transition-colors border border-transparent hover:border-secondary/50">
            <span className="font-headline text-xs uppercase text-on-surface-variant group-hover:text-white">Penalty Shield</span>
            <span className="font-headline font-black text-primary group-hover:scale-110 transition-transform">1200 PTS</span>
          </div>
        </div>
        <div className="mt-auto pt-8 relative overflow-hidden rounded-sm">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-secondary/20 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity"></div>
          <div className="w-full h-24 bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
            <span className="font-headline text-[10px] text-on-surface-variant tracking-widest text-center leading-tight">
              ENCRYPTED<br/>MERCHANT NETWORK
            </span>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2 bg-surface-container p-6 relative">
        <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-primary via-secondary to-transparent"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-black text-lg uppercase">MISSION LOG: RECENT INTEL</h3>
          <button className="font-headline text-[10px] text-primary hover:text-white uppercase tracking-widest transition-colors">
            View All Archive
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-headline">
            <thead>
              <tr className="text-[10px] text-on-surface-variant border-b border-outline-variant uppercase tracking-widest text-left">
                <th className="pb-3 px-2 font-normal">Timestamp</th>
                <th className="pb-3 px-2 font-normal">Action</th>
                <th className="pb-3 px-2 text-right font-normal">Yield</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-on-surface-variant italic">No recent intel available.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isClickable = log.sourceType === "Training Session" || log.sourceType === "workout";
                  return (
                    <tr 
                      key={log.id} 
                      className={cn(
                        "border-b border-outline-variant/10 transition-colors",
                        isClickable && "cursor-pointer",
                        log.isPenalty ? "hover:bg-error/10 text-error" : (isClickable ? "hover:bg-primary/10" : "hover:bg-surface-container-high")
                      )}
                      onClick={() => isClickable && setSelectedLogId(log.id)}
                    >
                    <td className={cn("py-4 px-2 font-body", log.isPenalty ? "opacity-80" : "text-on-surface-variant")}>
                      {log.time}
                    </td>
                    <td className={cn("py-4 px-2 uppercase font-bold", !log.isPenalty && "text-white")}>
                      <div className="flex items-center gap-2">
                        {log.action}
                        {isClickable && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-sm tracking-widest ml-1">DETAIL</span>}
                      </div>
                    </td>
                    <td className={cn(
                      "py-4 px-2 text-right font-black",
                      !log.isPenalty && "text-primary"
                    )}>
                      {log.yield}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <WorkoutRecordModal logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}
