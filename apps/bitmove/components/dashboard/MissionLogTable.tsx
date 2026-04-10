"use client";

import { useState } from "react";
import { WorkoutRecordModal } from "./WorkoutRecordModal";

export default function MissionLogTable({ logs }: { logs: any[] }) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const closeModals = () => {
    setSelectedLogId(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-headline">
          <thead className="bg-surface-container-high border-b-2 border-outline-variant/50">
            <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              <th className="p-4 py-6 font-black">Timestamp</th>
              <th className="p-4 py-6 font-black">Source</th>
              <th className="p-4 py-6 font-black">Description</th>
              <th className="p-4 py-6 font-black text-right">XP</th>
              <th className="p-4 py-6 font-black text-right">Points</th>
            </tr>
          </thead>
          <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
            {logs.map((log: any) => {
              const xp = log.xp_change || 0;
              const pts = log.points_change || 0;
              const isClickable = log.source_type === "Training Session" || log.source_type === "workout";
              
              return (
                <tr 
                  key={log.id} 
                  className={`transition-colors text-white ${isClickable ? "hover:bg-primary/10 cursor-pointer" : "hover:bg-surface-bright"}`}
                  onClick={() => isClickable && setSelectedLogId(log.id)}
                >
                  <td className="p-4 text-xs text-on-surface-variant font-body">
                    {log.created_at
                      ? new Intl.DateTimeFormat("id-ID", {
                          timeZone: "Asia/Jakarta",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).format(new Date(log.created_at))
                      : "-"}
                  </td>
                  <td className="p-4 uppercase text-[#ababab]">{log.source_type}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {log.description}
                      {isClickable && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-sm uppercase tracking-widest ml-2">Detail</span>}
                    </div>
                  </td>
                  <td className={`p-4 text-right ${xp > 0 ? "text-primary" : xp < 0 ? "text-error" : "text-on-surface-variant"}`}>
                    {xp > 0 ? `+${xp}` : xp}
                  </td>
                  <td className={`p-4 text-right ${pts > 0 ? "text-primary" : pts < 0 ? "text-error" : "text-on-surface-variant"}`}>
                    {pts > 0 ? `+${pts}` : pts}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals for Training Session Details */}
      <WorkoutRecordModal logId={selectedLogId} onClose={closeModals} />
    </>
  );
}
