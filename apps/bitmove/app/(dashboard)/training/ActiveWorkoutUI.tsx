"use client";

import { useState, useTransition } from "react";
import { PlaySquare, CheckCircle, PlusSquare, ArrowRight, X, Plus } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { addExerciseToWorkout, logSet, finishWorkout, createExercise } from "./actions";

import type { workouts, workout_exercises, sets, exercise_library, difficulty_scales } from "@prisma/client";

type WorkoutWithRelations = workouts & {
  workout_exercises: (workout_exercises & {
    exercises: exercise_library;
    sets: sets[];
  })[];
};

export function ActiveWorkoutUI({ 
  workout, 
  library,
  difficultyScales,
  todaysSchedule
}: { 
  workout: WorkoutWithRelations, 
  library: exercise_library[],
  difficultyScales: difficulty_scales[],
  todaysSchedule: any[]
}) {
  const [isPending, startTransition] = useTransition();
  const [showLib, setShowLib] = useState(false);
  const [showNewEx, setShowNewEx] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const handleFinish = () => {
    startTransition(async () => {
      await finishWorkout(workout.id);
      setShowFinishConfirm(false);
    });
  };

  const handleAddSet = (exerciseId: string, formData: FormData) => {
    const weight = parseFloat(formData.get("weight") as string) || 0;
    const reps = parseInt(formData.get("reps") as string) || 0;
    
    startTransition(async () => {
      // Kita tetap lempar 'C' ke action karena schema butuh validasi Not Null, tapi nilainya ini dihiraukan di perombakan baru
      await logSet(exerciseId, weight, reps);
    });
  };

  const getProgress = (scale_type: string, cumulativeValue: number) => {
    const scales = difficultyScales
      .filter((s) => s.scale_type === scale_type)
      .sort((a, b) => a.target_value - b.target_value);
    
    let currentTier = "None";
    let nextTierObj = scales[0]; 
    
    for(let i=0; i<scales.length; i++) {
      if(cumulativeValue >= scales[i].target_value) {
        currentTier = scales[i].tier;
        nextTierObj = scales[i+1];
      } else {
        nextTierObj = scales[i];
        break;
      }
    }
    return { currentTier, nextTierObj };
  };

  return (
    <div className="bg-surface-container border-l-4 border-secondary shadow-[0_0_15px_rgba(213,117,255,0.1)] p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-fast"></span>
            <span className="font-headline font-bold text-[10px] text-secondary uppercase tracking-widest">
              DEPLOYED: COMBAT SIMULATION
            </span>
          </div>
          <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-white">
            ACTIVE TRAINING SESSION
          </h2>
        </div>
        
        <div className="font-headline text-3xl font-black text-primary glitch-effect">
          <span className="text-sm font-bold block text-right text-on-surface-variant mb-1">XP POOL</span>
          {workout.total_xp_earned || 0} XP
        </div>
      </div>

      <div className="space-y-10">
        {workout.workout_exercises?.map((we, index: number) => {
          const missionTarget = todaysSchedule?.find(s => s.exercise_id === we.exercise_id);
          const cumulativeReps = we.sets.reduce((sum, s) => sum + (s.completed_value || 0), 0);
          const { currentTier, nextTierObj } = getProgress(we.exercises.scale_type, cumulativeReps);
          
          return (
            <div key={we.id} className="bg-surface-container-low border border-outline-variant/20 p-6 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-outline-variant group-hover:bg-primary transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline font-black uppercase text-xl text-primary">{we.exercises.name}</h3>
                  <span className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                    TARGET: {we.exercises.target_muscle}
                  </span>
                </div>
                <span className="font-headline font-black text-4xl text-surface-container-highest select-none">
                  0{index + 1}
                </span>
              </div>

              {/* RPG PROGRESS TRACKER */}
              <div className="mb-6 bg-surface-container-highest border border-outline-variant/30 p-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">CUMULATIVE PROGRESS</div>
                    <div className="font-headline font-black text-2xl text-white">
                      {currentTier === "None" ? "UNRANKED" : `TIER ${currentTier}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline font-bold text-[10px] text-primary uppercase tracking-widest mb-1">
                      TOTAL {we.exercises.measurement_unit?.toUpperCase() || "REPS"}
                    </div>
                    <div className="font-headline font-black text-xl text-primary">{cumulativeReps}</div>
                  </div>
                </div>
                
                {nextTierObj && (
                  <div>
                    <div className="w-full bg-surface-container h-2 mt-3 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(100, (cumulativeReps / nextTierObj.target_value) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="font-headline font-bold text-[9px] text-on-surface-variant tracking-widest uppercase">TARGET TIER {nextTierObj.tier}</span>
                       <span className="font-headline font-bold text-[9px] text-on-surface-variant tracking-widest uppercase">{cumulativeReps} / {nextTierObj.target_value}</span>
                    </div>
                  </div>
                )}

                {currentTier === "SS" && (
                  <div className="mt-3 font-headline font-bold text-[10px] text-yellow-400 uppercase tracking-widest">
                    🔥 MAX TIER REACHED! INCREDIBLE PERFORMANCE!
                  </div>
                )}

                {missionTarget && (
                  <div className="mt-4 inline-block bg-secondary/10 border border-secondary/30 text-secondary px-3 py-1.5 font-headline font-black text-[10px] uppercase tracking-widest">
                    QUEST TARGET: TIER {missionTarget.target_tier}
                  </div>
                )}
              </div>

              {/* Sets Table */}
              {we.sets.length > 0 && (
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full text-left font-headline mt-4">
                    <thead>
                      <tr className="text-[10px] text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">
                        <th className="pb-2 px-2">Set</th>
                        <th className="pb-2 px-2">Weight (KG)</th>
                        <th className="pb-2 px-2">Reps</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {we.sets.map((set) => (
                        <tr key={set.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors text-white font-bold">
                          <td className="py-3 px-2 text-on-surface-variant">{set.set_number}</td>
                          <td className="py-3 px-2">{set.weight_kg}</td>
                          <td className="py-3 px-2 text-primary">{set.completed_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Log Set Form */}
              <form 
                action={(formData) => handleAddSet(we.id, formData)}
                className="bg-surface-container p-4 border border-outline-variant/30 grid grid-cols-2 md:grid-cols-3 gap-4 items-end"
              >
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">Weight (KG)</label>
                  <input type="number" step="0.5" name="weight" className="w-full bg-surface-container-highest border border-outline-variant px-3 py-2 text-white font-headline text-sm focus:border-primary outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">{we.exercises.measurement_unit || "Reps"}</label>
                  <input type="number" name="reps" required className="w-full bg-surface-container-highest border border-outline-variant px-3 py-2 text-white font-headline text-sm focus:border-primary outline-none" placeholder="0" />
                </div>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black font-headline font-black text-xs uppercase tracking-widest py-2.5 transition-colors disabled:opacity-50"
                >
                  LOG SET
                </button>
              </form>
            </div>
          );
        })}

        <div className="pt-6 border-t border-dashed border-outline-variant/50 text-center">
          <button 
            onClick={() => setShowLib(true)}
            className="bg-transparent border-2 border-dashed border-secondary text-secondary hover:bg-secondary/10 font-headline font-black uppercase text-sm px-8 py-4 tracking-widest transition-all"
          >
            + ADD EXERCISE FROM LIBRARY
          </button>
        </div>
      </div>

      <div className="mt-12 flex justify-end">
        <button 
          onClick={() => setShowFinishConfirm(true)}
          disabled={isPending}
          className="bg-error text-black font-headline font-black uppercase text-sm px-10 py-4 tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_#ff7351] transition-shadow disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          {isPending ? "UPLOADING..." : "TERMINATE SESSION"}
        </button>
      </div>

      {/* Library Modal */}
      {showLib && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border-l-4 border-secondary w-full max-w-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
              <h3 className="font-headline font-black uppercase text-xl tracking-widest text-secondary">EXERCISE DATABASE</h3>
              <button onClick={() => setShowLib(false)} className="text-on-surface-variant hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-2">
              {library.length === 0 && !showNewEx ? (
                <div className="text-center py-10">
                  <p className="font-headline text-on-surface-variant uppercase tracking-widest font-bold mb-4">No exercises found.</p>
                  <button onClick={() => setShowNewEx(true)} className="text-secondary hover:text-primary font-headline font-black uppercase tracking-widest text-xs underline">Create Custom Exercise</button>
                </div>
              ) : null}

              {showNewEx ? (
                <form action={async (fd) => {
                  startTransition(async () => {
                    await createExercise(fd);
                    setShowNewEx(false);
                  });
                }} className="bg-surface-container p-6 border border-secondary/50 space-y-4">
                  <h4 className="font-headline font-bold text-primary text-sm uppercase mb-4">INITIALIZE NEW EXERCISE</h4>
                  <div><input name="name" placeholder="Exercise Name (e.g. Bench Press)" className="w-full bg-surface-container-highest p-3 text-sm border border-outline-variant font-headline" required /></div>
                  <div><input name="muscle" placeholder="Target Muscle (e.g. Chest)" className="w-full bg-surface-container-highest p-3 text-sm border border-outline-variant font-headline" /></div>
                  <div className="flex gap-4">
                    <button type="submit" disabled={isPending} className="flex-1 bg-secondary text-black font-black uppercase text-xs py-3">SAVE TO DB</button>
                    <button type="button" onClick={() => setShowNewEx(false)} className="flex-1 bg-transparent border border-outline-variant text-white font-black uppercase text-xs py-3">CANCEL</button>
                  </div>
                </form>
              ) : (
                library.map((ex) => (
                  <div key={ex.id} className="bg-surface-container p-4 flex justify-between items-center hover:bg-surface-bright transition-colors border-l-2 border-transparent hover:border-primary group">
                    <div>
                      <div className="font-headline font-bold text-sm uppercase text-white">{ex.name}</div>
                      <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">{ex.target_muscle} • {ex.scale_type}</div>
                    </div>
                    <button 
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          await addExerciseToWorkout(workout.id, ex.id);
                          setShowLib(false);
                        });
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black"
                    >
                      <Plus className="w-5 h-5 font-black" />
                    </button>
                  </div>
                ))
              )}

              {!showNewEx && library.length > 0 && (
                <div className="mt-8 pt-4 border-t border-outline-variant/30 text-center">
                  <button onClick={() => setShowNewEx(true)} className="text-on-surface-variant hover:text-white font-headline font-bold text-xs uppercase tracking-widest">+ Define Custom Exercise</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showFinishConfirm}
        title="SELESAIKAN SESI LATIHAN"
        description={<>Selesaikan sesi ini dan simpan progress xp kamu?</>}
        onConfirm={handleFinish}
        onCancel={() => setShowFinishConfirm(false)}
        isLoading={isPending}
        isDestructive={false}
      />
    </div>
  );
}
