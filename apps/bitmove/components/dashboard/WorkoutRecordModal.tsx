"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { getWorkoutFromLog } from "@/app/(dashboard)/mission-log/actions";
import { ChevronRight } from "lucide-react";

export function WorkoutRecordModal({
  logId,
  onClose
}: {
  logId: string | null;
  onClose: () => void;
}) {
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!logId) {
        setWorkoutData(null);
        setSelectedExercise(null);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await getWorkoutFromLog(logId);
        setWorkoutData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [logId]);

  const handleClose = () => {
    setSelectedExercise(null);
    onClose();
  };

  return (
    <>
      {/* Level 1 Popup: Workout Summary */}
      <Modal 
        isOpen={!!logId && !selectedExercise} 
        onClose={handleClose} 
        title="TRAINING SESSION RECORD"
        width="max-w-2xl"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-primary font-headline animate-pulse">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            DECRYPTING SESSION DATA...
          </div>
        ) : !workoutData ? (
           <div className="text-center py-10 text-error font-headline uppercase tracking-widest border border-error/20 bg-error/5 border-dashed">
             No specific data found for this session.
             <br/><span className="text-xs text-on-surface-variant mt-2 block">It may be an older record or missing sync.</span>
           </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 border border-outline-variant/30">
              <div className="p-4 bg-surface-container text-center">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">XP Yield</div>
                <div className="text-2xl font-black text-primary">+{workoutData.total_xp_earned}</div>
              </div>
              <div className="p-4 bg-surface-container text-center border-l border-outline-variant/30">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Points</div>
                <div className="text-2xl font-black text-secondary">+{workoutData.total_points_earned}</div>
              </div>
              <div className="p-4 bg-surface-container text-center border-l border-outline-variant/30 relative overflow-hidden group">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Duration</div>
                <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
                  {workoutData.ended_at && workoutData.started_at 
                    ? Math.max(1, Math.round((new Date(workoutData.ended_at).getTime() - new Date(workoutData.started_at).getTime()) / 60000)) + "m"
                    : "-"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest flex items-center justify-between">
                <span>EXECUTED OPERATIONS</span>
                <span className="text-white bg-surface-container-high px-2 py-0.5">{workoutData.workout_exercises?.length || 0}</span>
              </h3>
              
              {workoutData.workout_exercises?.length === 0 && (
                <div className="p-8 text-center border border-dashed border-outline-variant/30 text-on-surface-variant text-xs">
                  NO EXERCISES LOGGED
                </div>
              )}
              
              <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-2 mt-4">
                {workoutData.workout_exercises?.map((we: any) => {
                  const totalCompleted = we.sets.reduce((acc: number, set: any) => acc + (set.completed_value || 0), 0);
                  
                  return (
                    <div 
                      key={we.id} 
                      className="flex justify-between items-center p-4 bg-surface-container-high border border-outline-variant/20 hover:border-primary/50 cursor-pointer transition-colors group"
                      onClick={() => setSelectedExercise(we)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-white uppercase group-hover:text-primary transition-colors text-sm">
                          {we.exercises?.name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-body mt-1 uppercase tracking-widest">
                          Target: {we.exercises?.target_muscle || 'Full Body'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-black text-white leading-none">
                            {we.exercises?.measurement_unit === "seconds" 
                              ? `${Math.floor(totalCompleted / 60)}m ${totalCompleted % 60}s`
                              : `${totalCompleted} ${we.exercises?.measurement_unit || 'reps'}`}
                          </div>
                          <div className="text-[10px] text-on-surface-variant tracking-widest uppercase mt-1">
                            {we.sets.length} Sets
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Level 2 Popup: Exercise Details */}
      <Modal 
        isOpen={!!selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
        title={`${selectedExercise?.exercises?.name}`}
        width="max-w-md"
      >
        <div className="space-y-4">
           {/* Header Info */}
          <div className="bg-surface-container p-4 text-center border border-outline-variant/30 flex justify-around">
            <div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">TOTAL VOLUME</div>
              <div className="text-2xl font-black text-white">
                {selectedExercise?.exercises?.measurement_unit === "seconds" ?
                   // format to mm:ss
                   `${Math.floor(selectedExercise?.sets?.reduce((acc: number, set: any) => acc + (set.completed_value || 0), 0) / 60)}:${(selectedExercise?.sets?.reduce((acc: number, set: any) => acc + (set.completed_value || 0), 0) % 60).toString().padStart(2, '0')}`
                   :
                   selectedExercise?.sets?.reduce((acc: number, set: any) => acc + (set.completed_value || 0), 0)
                } 
                <span className="text-[10px] font-normal text-on-surface-variant ml-1">{selectedExercise?.exercises?.measurement_unit}</span>
              </div>
            </div>
             <div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">MAX WEIGHT</div>
              <div className="text-2xl font-black text-primary">
                {Math.max(0, ...selectedExercise?.sets?.map((s:any) => s.weight_kg) || [0])} <span className="text-[10px] font-normal text-on-surface-variant">kg</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {selectedExercise?.sets?.map((set: any) => (
              <div key={set.id} className="flex justify-between items-center bg-surface-container-high p-3 border-l-[3px] border-secondary">
                <div className="flex items-center gap-3">
                  <div className="bg-surface-container-highest w-8 h-8 flex items-center justify-center font-black text-xs text-white uppercase border border-outline-variant/30">
                    S{set.set_number}
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant font-headline tracking-widest uppercase">Record</div>
                    <div className="font-bold text-white text-sm">
                       {selectedExercise?.exercises?.measurement_unit === "seconds" ? 
                         `${Math.floor(set.completed_value / 60)}m ${set.completed_value % 60}s`
                         : 
                         `${set.completed_value} ${selectedExercise?.exercises?.measurement_unit}`
                       }
                    </div>
                  </div>
                </div>
                
                {set.weight_kg > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-on-surface-variant font-headline tracking-widest uppercase">Load</div>
                    <div className="font-bold text-primary text-sm flex items-end gap-1">
                      {set.weight_kg} <span className="text-[10px] text-primary/70 pb-0.5">kg</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button 
             onClick={() => setSelectedExercise(null)}
             className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 text-white uppercase font-black text-xs tracking-widest transition-colors border border-outline-variant/30"
          >
             BACK TO SUMMARY
          </button>
        </div>
      </Modal>
    </>
  );
}
