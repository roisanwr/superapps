"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X, Zap, ChevronRight, Trash2 } from "lucide-react";
import { saveAndActivateProgram, SlotInput } from "./actions";
import { tier_enum } from "@prisma/client";
import { useRouter } from "next/navigation";

const DAYS = [
  { label: "SEN", full: "Senin", value: 1 },
  { label: "SEL", full: "Selasa", value: 2 },
  { label: "RAB", full: "Rabu", value: 3 },
  { label: "KAM", full: "Kamis", value: 4 },
  { label: "JUM", full: "Jumat", value: 5 },
  { label: "SAB", full: "Sabtu", value: 6 },
  { label: "MIN", full: "Minggu", value: 7 },
];

const TIERS: tier_enum[] = ["D", "C", "B", "A", "S", "SS"];
const TIER_COLORS: Record<string, string> = {
  D: "text-on-surface-variant border-outline-variant",
  C: "text-primary border-primary",
  B: "text-secondary border-secondary",
  A: "text-tertiary border-tertiary",
  S: "text-yellow-400 border-yellow-400",
  SS: "text-yellow-300 border-yellow-300",
};

interface ExerciseItem {
  id: string;
  name: string;
  target_muscle: string | null;
  scale_type: string;
}

interface Props {
  exercises: ExerciseItem[];
  initialProgram?: any;
}

interface SlotState {
  exerciseId: string;
  exerciseName: string;
  targetTier: tier_enum;
}

export function BuilderUI({ exercises, initialProgram }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);
  const [slots, setSlots] = useState<Record<string, SlotState[]>>({});

  // Modal state
  const [modal, setModal] = useState<{ week: number; day: number } | null>(null);
  const [pickedExercise, setPickedExercise] = useState<ExerciseItem | null>(null);
  const [pickedTier, setPickedTier] = useState<tier_enum>("C");
  const [exSearch, setExSearch] = useState("");

  const slotKey = (week: number, day: number) => `${week}-${day}`;

  useEffect(() => {
    if (initialProgram) {
      setTitle(initialProgram.title);
      setTotalWeeks(initialProgram.total_weeks);
      
      const parsedSlots: Record<string, SlotState[]> = {};
      if (initialProgram.program_schedules) {
        initialProgram.program_schedules.forEach((s: any) => {
          const key = `${s.week_number}-${s.day_of_week}`;
          if (!parsedSlots[key]) parsedSlots[key] = [];
          parsedSlots[key].push({
            exerciseId: s.exercise_id,
            exerciseName: s.exercise_library?.name || "Unknown",
            targetTier: s.target_tier,
          });
        });
      }
      setSlots(parsedSlots);
    }
  }, [initialProgram]);

  const openModal = (week: number, day: number) => {
    setModal({ week, day });
    setPickedExercise(null);
    setPickedTier("C");
    setExSearch("");
  };

  const addSlot = () => {
    if (!modal || !pickedExercise) return;
    const key = slotKey(modal.week, modal.day);
    setSlots((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] ?? []),
        { exerciseId: pickedExercise.id, exerciseName: pickedExercise.name, targetTier: pickedTier },
      ],
    }));
    setModal(null);
  };

  const removeSlot = (week: number, day: number, idx: number) => {
    const key = slotKey(week, day);
    setSlots((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated.splice(idx, 1);
      return { ...prev, [key]: updated };
    });
  };

  const handleActivate = () => {
    if (!title.trim()) {
      alert("Masukkan judul program dulu, Warrior!");
      return;
    }

    const allSlots: SlotInput[] = [];
    for (const [key, slotList] of Object.entries(slots)) {
      const [week, day] = key.split("-").map(Number);
      for (const s of slotList) {
        allSlots.push({
          exerciseId: s.exerciseId,
          weekNumber: week,
          dayOfWeek: day,
          targetTier: s.targetTier,
        });
      }
    }

    if (allSlots.length === 0) {
      alert("Isi minimal 1 latihan ke dalam jadwal!");
      return;
    }

    startTransition(async () => {
      await saveAndActivateProgram(title, totalWeeks, allSlots, initialProgram?.id);
      router.push("/training");
    });
  };

  const filteredEx = exercises.filter((e) =>
    e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  const totalSlots = Object.values(slots).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          PROGRAM BUILDER
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-secondary pl-3">
          RACIK JADWAL LATIHAN HINGGA 4 MINGGU. SISTEM AKAN LOOPING OTOMATIS.
        </p>
      </div>

      {/* Config Bar */}
      <div className="bg-surface-container border-l-4 border-secondary p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
            Nama Program
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Program Pembentukan Otot Sparky"
            className="w-full bg-surface-container-highest border border-outline-variant px-4 py-3 text-white font-headline text-sm focus:border-secondary outline-none placeholder:text-on-surface-variant/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
            Durasi Siklus
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => {
                  setTotalWeeks(w);
                  setActiveWeek(Math.min(activeWeek, w));
                }}
                className={`flex-1 py-3 font-headline font-black text-sm uppercase tracking-widest border transition-all ${
                  totalWeeks === w
                    ? "bg-secondary text-black border-secondary shadow-[0_0_15px_rgba(213,117,255,0.5)]"
                    : "bg-transparent text-on-surface-variant border-outline-variant hover:border-secondary hover:text-white"
                }`}
              >
                {w}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            onClick={() => setActiveWeek(w)}
            className={`px-6 py-3 font-headline font-black text-xs uppercase tracking-widest border-b-2 transition-all ${
              activeWeek === w
                ? "border-primary text-primary bg-surface-container"
                : "border-transparent text-on-surface-variant hover:text-white"
            }`}
          >
            WEEK {w}
          </button>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
        {DAYS.map((day) => {
          const key = slotKey(activeWeek, day.value);
          const daySlots = slots[key] ?? [];

          return (
            <div
              key={day.value}
              className="bg-surface-container border border-outline-variant/30 p-3 min-h-[160px] flex flex-col group hover:border-secondary/50 transition-colors"
            >
              <div className="font-headline font-black text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/30 pb-2 mb-3">
                {day.label}
              </div>

              <div className="flex-1 space-y-2">
                {daySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-lowest p-2 flex justify-between items-start gap-1 group/slot"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-[10px] text-white uppercase truncate">
                        {slot.exerciseName}
                      </div>
                      <div
                        className={`font-headline font-black text-[10px] border-b ${TIER_COLORS[slot.targetTier]} mt-0.5 w-fit`}
                      >
                        TIER {slot.targetTier}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSlot(activeWeek, day.value, idx)}
                      className="text-error/40 hover:text-error transition-colors shrink-0 mt-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => openModal(activeWeek, day.value)}
                className="mt-2 w-full py-1.5 border border-dashed border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary font-headline font-bold text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                ADD
              </button>
            </div>
          );
        })}
      </div>

      {/* Activate Button */}
      <div className="flex items-center justify-between bg-surface-container-low border-t-2 border-secondary p-6">
        <div className="font-headline text-sm">
          <span className="text-on-surface-variant uppercase tracking-widest text-xs">Total Slot: </span>
          <span className="text-secondary font-black text-xl ml-2">{totalSlots}</span>
          <span className="text-on-surface-variant text-xs ml-1">latihan</span>
        </div>
        <button
          onClick={handleActivate}
          disabled={isPending}
          className="bg-secondary text-black font-headline font-black py-4 px-10 uppercase tracking-widest flex items-center gap-3 hover:shadow-[0_0_25px_rgba(213,117,255,0.6)] transition-all disabled:opacity-50 glitch-effect"
        >
          <Zap className="w-5 h-5 fill-current" />
          {isPending ? "DEPLOYING..." : (initialProgram ? "SIMPAN & AKTIFKAN PROGRAM" : "AKTIFKAN PROGRAM")}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-surface-container-low border-l-4 border-secondary w-full max-w-lg animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
              <div>
                <div className="font-headline font-black text-[10px] uppercase tracking-widest text-secondary mb-0.5">
                  {DAYS.find((d) => d.value === modal.day)?.full} — WEEK {modal.week}
                </div>
                <h3 className="font-headline font-black uppercase text-lg tracking-widest text-white">
                  PILIH LATIHAN
                </h3>
              </div>
              <button onClick={() => setModal(null)} className="text-on-surface-variant hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Exercise Search */}
              <input
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                placeholder="Cari exercise..."
                className="w-full bg-surface-container-highest border border-outline-variant px-3 py-2 text-white font-headline text-sm focus:border-secondary outline-none"
                autoFocus
              />

              {/* Exercise List */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredEx.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setPickedExercise(ex)}
                    className={`w-full text-left p-3 flex justify-between items-center transition-all ${
                      pickedExercise?.id === ex.id
                        ? "bg-secondary/20 border-l-2 border-secondary"
                        : "bg-surface-container hover:bg-surface-container-high border-l-2 border-transparent"
                    }`}
                  >
                    <div>
                      <div className="font-headline font-bold text-sm uppercase text-white">
                        {ex.name}
                      </div>
                      <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {ex.target_muscle} • {ex.scale_type}
                      </div>
                    </div>
                    {pickedExercise?.id === ex.id && (
                      <ChevronRight className="w-4 h-4 text-secondary" />
                    )}
                  </button>
                ))}
                {filteredEx.length === 0 && (
                  <p className="text-on-surface-variant font-headline text-sm text-center py-4">
                    Tidak ada exercise yang cocok.
                  </p>
                )}
              </div>

              {/* Tier Picker */}
              {pickedExercise && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
                    Target Tier
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {TIERS.map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setPickedTier(tier)}
                        className={`py-2.5 font-headline font-black text-sm border transition-all ${
                          pickedTier === tier
                            ? `bg-current/20 ${TIER_COLORS[tier]} shadow-sm`
                            : "border-outline-variant/40 text-on-surface-variant hover:border-outline-variant"
                        } ${TIER_COLORS[tier]}`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={addSlot}
                disabled={!pickedExercise}
                className="w-full bg-secondary text-black font-headline font-black py-3 uppercase tracking-widest disabled:opacity-40 transition-all hover:shadow-[0_0_15px_rgba(213,117,255,0.4)]"
              >
                + TAMBAHKAN KE JADWAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
