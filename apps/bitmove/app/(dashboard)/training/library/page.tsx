import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { exerciseLibrary } from "@woilaa/db-bitmove";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Database } from "lucide-react";
import { createExercise } from "../actions";

export const metadata = {
  title: "EXERCISE LIBRARY | BITMOVE",
};

export default async function TrainingLibraryPage() {
  const user = await requireUser().catch(() => null);
  if (!user?.sub) return <div>Unauthorized Access.</div>;

  const library = await db.query.exerciseLibrary.findMany({
    where: eq(exerciseLibrary.isArchived, false),
    orderBy: [asc(exerciseLibrary.name)]
  });

  const systemExercises = library.filter(ex => !ex.createdBy);
  const customExercises = library.filter(ex => ex.createdBy === user.sub);

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <Link href="/training" className="inline-flex items-center gap-2 font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          BACK TO TRAINING GROUND
        </Link>
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          EXERCISE LIBRARY
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-secondary pl-3">
          GLOBAL DATABASE OF ALL KNOWN PHYSICAL MOVEMENTS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* System Exercises */}
          <section className="bg-surface-container border border-outline-variant/30">
            <div className="bg-surface-container-high border-b border-outline-variant/30 p-4 flew items-center justify-between">
              <h2 className="font-headline font-black uppercase text-secondary tracking-widest text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                SYSTEM PRESETS
              </h2>
            </div>
            {systemExercises.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-headline uppercase tracking-widest text-xs">
                DATABASE CORRUPT. NO SYSTEM EXERCISES FOUND.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {systemExercises.map(ex => (
                  <div key={ex.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-surface-bright transition-colors group">
                    <div className="mb-2 md:mb-0">
                      <div className="font-headline font-bold uppercase text-white">{ex.name}</div>
                      <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                        {ex.targetMuscle || "Full Body"} • {ex.scaleType}
                      </div>
                    </div>
                    <div className="bg-surface-container-highest px-3 py-1 text-[10px] text-on-surface-variant font-headline uppercase font-bold tracking-widest border border-outline-variant/30">
                      SYS_DEFAULT
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Custom Exercises */}
          <section className="bg-surface-container border border-outline-variant/30">
            <div className="bg-surface-container-high border-b border-outline-variant/30 p-4 flew items-center justify-between">
              <h2 className="font-headline font-black uppercase text-primary tracking-widest text-sm flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                CUSTOM USER EXERCISES
              </h2>
            </div>
            {customExercises.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-headline uppercase tracking-widest text-xs opacity-70">
                NO CUSTOM DATA INJECTED YET.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {customExercises.map(ex => (
                  <div key={ex.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-surface-bright transition-colors">
                    <div className="mb-2 md:mb-0">
                      <div className="font-headline font-bold uppercase text-white">{ex.name}</div>
                      <div className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                        {ex.targetMuscle || "Full Body"} • {ex.scaleType}
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-[10px] font-headline uppercase font-bold tracking-widest">
                      CUSTOM
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Add New Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container border-t-4 border-secondary p-6 sticky top-28">
            <h3 className="font-headline font-black uppercase tracking-tighter text-xl mb-4">
              INJECT NEW DATA
            </h3>
            <p className="font-body text-xs text-on-surface-variant mb-6">
              Define a new physical movement protocol to be added to your personal database.
            </p>
            
            <form action={createExercise} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                  Protocol Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Incline Dumbbell Press"
                  className="w-full bg-surface-container-highest border border-outline-variant px-4 py-3 text-white font-headline text-sm focus:border-secondary outline-none transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                  Target Muscle Group
                </label>
                <input 
                  type="text" 
                  name="muscle" 
                  placeholder="e.g. Upper Chest"
                  className="w-full bg-surface-container-highest border border-outline-variant px-4 py-3 text-white font-headline text-sm focus:border-secondary outline-none transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                  Measurement Unit
                </label>
                <select 
                  name="unit" 
                  className="w-full bg-surface-container-highest border border-outline-variant px-4 py-3 text-white font-headline text-sm focus:border-secondary outline-none transition-colors appearance-none"
                >
                  <option value="reps">Reps</option>
                  <option value="seconds">Seconds</option>
                  <option value="meters">Meters</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-secondary text-black font-headline font-black uppercase tracking-widest py-4 glitch-effect hover:shadow-[0_0_15px_#d575ff] transition-all"
                >
                  SAVE PROTOCOL
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
