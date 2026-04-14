"use client";

import { useState, useTransition, useEffect } from "react";
import { Check, Plus, Clock, Target, AlertTriangle, Trash2, ShieldAlert, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { toggleTask, deleteTask } from "./actions";

export function QuestList({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [violateTarget, setViolateTarget] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleToggle = (taskId: string, currentStatus: boolean, priority: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
    );
    startTransition(async () => {
      await toggleTask(taskId, currentStatus, priority, "POSITIVE");
    });
  };

  const handleViolateInitiate = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setViolateTarget(task);
  };

  const handleViolateConfirm = () => {
    if (!violateTarget) return;
    const task = violateTarget;
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, isCompleted: true } : t)
    );
    setViolateTarget(null);
    startTransition(async () => {
      await toggleTask(task.id, false, task.priority, "NEGATIVE");
    });
  };

  const handleDeleteInitiate = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(task);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    const taskId = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      await deleteTask(taskId);
    });
  };

  const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

  const processTasks = (taskList: any[]) =>
    [...taskList].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });

  const positiveTasks = tasks.filter((t) => (t.polarity ?? "POSITIVE") === "POSITIVE");
  const dailyTasks    = processTasks(positiveTasks.filter((t) => t.frequency === "Daily"));
  const weeklyTasks   = processTasks(positiveTasks.filter((t) => t.frequency === "Weekly"));
  const forbiddenTasks = processTasks(tasks.filter((t) => t.polarity === "NEGATIVE"));

  // -------------- Positive Task Item --------------
  const TaskItem = ({ task }: { task: any }) => {
    const isCompleted = task.isCompleted;
    const priorityColor =
      task.priority === "High" ? "text-error" :
      task.priority === "Medium" ? "text-secondary" :
      "text-primary";
    const xpReward = task.priority === "High" ? 150 : task.priority === "Medium" ? 75 : 30;

    return (
      <div
        onClick={() => !isCompleted && handleToggle(task.id, isCompleted, task.priority)}
        className={cn(
          "flex items-center gap-4 p-4 transition-all group border-l-4",
          isCompleted
            ? "bg-surface-container-highest border-outline-variant opacity-60"
            : "bg-surface-container border-primary hover:bg-surface-bright cursor-pointer hover:translate-x-1"
        )}
      >
        <div className={cn(
          "w-6 h-6 border-2 flex items-center justify-center transition-colors shrink-0",
          isCompleted
            ? "border-outline-variant bg-surface-container-low"
            : "border-primary group-hover:bg-primary/10"
        )}>
          {isCompleted && <Check className="w-4 h-4 text-outline-variant" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-headline font-bold text-sm uppercase transition-all flex items-center gap-2",
            isCompleted ? "line-through text-on-surface-variant" : "text-white"
          )}>
            {task.title}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className={cn(
              "font-body text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
              isCompleted ? "text-on-surface-variant" : priorityColor
            )}>
              {task.priority === "High" && <AlertTriangle className="w-3 h-3" />}
              {task.priority === "Medium" && <Target className="w-3 h-3" />}
              PRIORITY: {task.priority}
            </span>
            <span className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            "font-headline font-black text-sm",
            isCompleted ? "text-on-surface-variant" : "text-primary"
          )}>
            +{xpReward} XP
          </span>
          <button
            onClick={(e) => handleDeleteInitiate(task, e)}
            disabled={isPending}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors rounded-sm opacity-0 group-hover:opacity-100"
            title="Delete Directive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // -------------- Forbidden Task Item --------------
  const ForbiddenItem = ({ task }: { task: any }) => {
    const isViolated = task.isCompleted;
    const xpPenalty  = task.priority === "High" ? 200 : task.priority === "Medium" ? 100 : 50;
    const ptsPenalty = task.priority === "High" ? 100 : task.priority === "Medium" ? 50  : 25;

    return (
      <div className={cn(
        "flex items-center gap-4 p-4 transition-all group border-l-4",
        isViolated
          ? "bg-error/5 border-error/30 opacity-50"
          : "bg-surface-container border-error/60 hover:bg-error/5"
      )}>
        {/* Status icon */}
        <div className={cn(
          "w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-colors",
          isViolated ? "border-error/30 bg-error/10" : "border-error/60"
        )}>
          {isViolated
            ? <Skull className="w-4 h-4 text-error/50" />
            : <ShieldAlert className="w-4 h-4 text-error/60" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-headline font-bold text-sm uppercase flex items-center gap-2",
            isViolated ? "line-through text-error/40" : "text-error/90"
          )}>
            {task.title}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="font-body text-[10px] font-bold uppercase tracking-widest text-error/50 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              PENALTY: -{xpPenalty} XP / -{ptsPenalty} PTS
            </span>
            <span className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isViolated ? (
            <span className="font-headline font-black text-[10px] uppercase tracking-widest text-error/50 px-3 py-1 border border-error/20 bg-error/5">
              VIOLATED
            </span>
          ) : (
            <button
              onClick={(e) => handleViolateInitiate(task, e)}
              disabled={isPending}
              className="font-headline font-black text-[10px] uppercase tracking-widest px-3 py-2 bg-error/10 border border-error/40 text-error hover:bg-error/20 hover:border-error transition-all flex items-center gap-1.5"
            >
              <Skull className="w-3 h-3" />
              SAYA MELANGGAR
            </button>
          )}
          <button
            onClick={(e) => handleDeleteInitiate(task, e)}
            disabled={isPending}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors rounded-sm opacity-0 group-hover:opacity-100"
            title="Delete Protocol"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* DAILY DIRECTIVES */}
      <div>
        <h2 className="font-headline font-black uppercase tracking-tighter text-2xl mb-4 text-primary">DAILY DIRECTIVES</h2>
        <div className="space-y-3">
          {dailyTasks.length === 0 ? (
            <div className="p-8 border border-dashed border-outline-variant text-center text-on-surface-variant font-headline uppercase text-xs tracking-widest">
              No daily directives assigned.
            </div>
          ) : (
            dailyTasks.map(t => <TaskItem key={t.id} task={t} />)
          )}
        </div>
      </div>

      {/* WEEKLY OBJECTIVES */}
      <div>
        <h2 className="font-headline font-black uppercase tracking-tighter text-2xl mb-4 text-secondary">WEEKLY OBJECTIVES</h2>
        <div className="space-y-3">
          {weeklyTasks.length === 0 ? (
            <div className="p-8 border border-dashed border-outline-variant text-center text-on-surface-variant font-headline uppercase text-xs tracking-widest">
              No weekly objectives assigned.
            </div>
          ) : (
            weeklyTasks.map(t => <TaskItem key={t.id} task={t} />)
          )}
        </div>
      </div>

      {/* FORBIDDEN PROTOCOLS */}
      <div>
        <h2 className="font-headline font-black uppercase tracking-tighter text-2xl mb-1 text-error flex items-center gap-3">
          <ShieldAlert className="w-6 h-6" />
          FORBIDDEN PROTOCOLS
        </h2>
        <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-error/50 mb-4 border-l-2 border-error/30 pl-3">
          PANTANGAN HARIAN — TAHAN GODAAN. MELANGGAR = HUKUMAN BERAT.
        </p>
        <div className="space-y-3">
          {forbiddenTasks.length === 0 ? (
            <div className="p-8 border border-dashed border-error/20 text-center text-error/40 font-headline uppercase text-xs tracking-widest">
              No forbidden protocols assigned. Kamu bebas dari pantangan... untuk sekarang.
            </div>
          ) : (
            forbiddenTasks.map(t => <ForbiddenItem key={t.id} task={t} />)
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="HAPUS DIREKTIF"
        description={<>Apakah kamu yakin ingin membatalkan misi <span className="text-white font-bold">&quot;{deleteTarget?.title}&quot;</span>?</>}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isPending}
      />

      {/* Violation confirm modal — lebih intimidatif */}
      <ConfirmModal
        isOpen={!!violateTarget}
        title="⚠ KONFIRMASI PELANGGARAN"
        description={
          <>
            Apakah kamu benar-benar telah melanggar pantangan{" "}
            <span className="text-error font-bold">&quot;{violateTarget?.title}&quot;</span>?
            <br /><br />
            <span className="text-error/70 text-xs">
              Hukuman:{" "}
              <strong>
                -{violateTarget?.priority === "High" ? 200 : violateTarget?.priority === "Medium" ? 100 : 50} XP
              </strong>{" "}
              &amp;{" "}
              <strong>
                -{violateTarget?.priority === "High" ? 100 : violateTarget?.priority === "Medium" ? 50 : 25} Points
              </strong>{" "}
              akan langsung dipotong. Ini tidak bisa di-undo.
            </span>
          </>
        }
        onConfirm={handleViolateConfirm}
        onCancel={() => setViolateTarget(null)}
        isLoading={isPending}
      />
    </div>
  );
}
