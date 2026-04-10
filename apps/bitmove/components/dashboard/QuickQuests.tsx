"use client";

import { Check } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toggleTask } from "@/app/(dashboard)/quests/actions";
import { useRouter } from "next/navigation";

export type QuestProp = {
  id: string;
  title: string;
  priority: "OMEGA" | "HIGH" | "NORMAL";
  xpGain: number;
  completed: boolean;
};

export function QuickQuests({ quests = [] }: { quests?: QuestProp[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localQuests, setLocalQuests] = useState<QuestProp[]>(quests);

  // Sync with prop when server data changes
  useEffect(() => {
    setLocalQuests(quests);
  }, [quests]);

  const handleComplete = (id: string, priority: string) => {
    const q = localQuests.find(x => x.id === id);
    if (!q || q.completed) return;

    // Optimistic UI
    setLocalQuests(prev => prev.map(item => item.id === id ? { ...item, completed: true } : item));

    startTransition(async () => {
      // Priority string needs to match TaskPriority Enum (High/Medium/Low)
      const mappedPriority = priority === "OMEGA" || priority === "HIGH" ? "High" : priority === "NORMAL" ? "Medium" : "Low";
      await toggleTask(id, false, mappedPriority); // false because we are current NOT completed, completing it
      router.refresh(); // Fetch new server data
    });
  };

  return (
    <div className="bg-surface-container-low p-6 flex flex-col border-t-4 border-primary shadow-lg h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline font-black uppercase tracking-tighter text-xl">QUICK QUESTS</h2>
        <span className="font-headline font-bold text-[10px] text-error px-2 py-1 bg-error/10 border border-error/30">
          DAILY PRIORITIES
        </span>
      </div>
      
      <div className="space-y-4">
        {localQuests.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs uppercase">
            No active priorities found
          </div>
        ) : (
          localQuests.map((quest) => (
            <div
              key={quest.id}
              onClick={() => handleComplete(quest.id, quest.priority)}
              className={cn(
                "flex items-center gap-4 p-4 transition-all",
                quest.completed 
                  ? "bg-surface-container-highest border-l-4 border-outline-variant opacity-60 pointer-events-none" 
                  : `bg-surface-container-high border-l-4 border-primary hover:bg-surface-bright cursor-pointer hover:translate-x-1 group ${isPending ? 'opacity-70 pointer-events-none' : ''}`
              )}
            >
              <div className={cn(
                "w-6 h-6 border-2 flex items-center justify-center transition-colors",
                quest.completed 
                  ? "border-outline-variant bg-surface-container-low" 
                  : "border-primary group-hover:bg-primary/10"
              )}>
                {quest.completed && <Check className="w-4 h-4 text-outline-variant" />}
              </div>
              <div className="flex-1">
                <div className={cn(
                  "font-headline font-bold text-xs uppercase transition-all",
                  quest.completed ? "line-through text-on-surface-variant" : "text-white"
                )}>
                  {quest.title}
                </div>
                <div className={cn(
                  "font-body text-[10px] font-bold uppercase",
                  quest.completed ? "text-on-surface-variant" 
                  : quest.priority === "OMEGA" ? "text-error" 
                  : quest.priority === "HIGH" ? "text-secondary" 
                  : "text-primary"
                )}>
                  {quest.completed ? "COMPLETED" : `PRIORITY: ${quest.priority}`}
                </div>
              </div>
              <span className={cn(
                "font-headline font-black text-xs",
                quest.completed ? "text-on-surface-variant" : "text-primary"
              )}>
                +{quest.xpGain} XP
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
