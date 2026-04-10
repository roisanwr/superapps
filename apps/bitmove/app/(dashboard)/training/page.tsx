import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Play, Activity, Swords, Plus, LayoutGrid } from "lucide-react";
import { ActiveWorkoutUI } from "./ActiveWorkoutUI";
import { getTodayWorkoutPlan } from "@/lib/services/workoutService";
import { startWorkoutFromPlan, startEmptyWorkout } from "./actions";
import { tier_enum } from "@prisma/client";

export const metadata = {
  title: "TRAINING GROUND | BITMOVE",
};

const TIER_COLORS: Record<tier_enum, string> = {
  D: "text-on-surface-variant border-on-surface-variant",
  C: "text-primary border-primary",
  B: "text-secondary border-secondary",
  A: "text-tertiary border-tertiary",
  S: "text-yellow-400 border-yellow-400",
  SS: "text-yellow-300 border-yellow-300",
};

const DAY_NAMES: Record<number, string> = {
  1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis",
  5: "Jumat", 6: "Sabtu", 7: "Minggu",
};

export default async function TrainingPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Unauthorized Access.</div>;

  // Cek apakah ada sesi workout yang sedang aktif
  const activeWorkout = await prisma.workouts.findFirst({
    where: {
      user_id: session.user.id,
      status: "in_progress",
    },
    include: {
      workout_exercises: {
        include: {
          exercises: true,
          sets: { orderBy: { set_number: "asc" } },
        },
      },
    },
  });

  const library = await prisma.exercise_library.findMany({
    where: { is_archived: false },
    orderBy: { name: "asc" },
  });

  const difficultyScales = await prisma.difficulty_scales.findMany();
  const plan = await getTodayWorkoutPlan(session.user.id);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          TRAINING GROUND
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-secondary pl-3">
          PHYSICAL CONDITIONING MODULE. START WORKOUT TO EARN XP.
        </p>
      </div>

      {activeWorkout ? (
        // STATE A: Ada workout in_progress → tampilkan ActiveWorkoutUI
        <ActiveWorkoutUI 
          workout={activeWorkout} 
          library={library} 
          difficultyScales={difficultyScales}
          todaysSchedule={plan?.todaysSchedule || []}
        />
      ) : (
        <TodayMissionView plan={plan} library={library} />
      )}
    </div>
  );
}

import type { exercise_library } from "@prisma/client";

async function TodayMissionView({
  plan,
  library,
}: {
  plan: any;
  library: exercise_library[];
}) {
  const today = new Date();
  const todayDayNum = today.getDay() === 0 ? 7 : today.getDay();
  const todayName = DAY_NAMES[todayDayNum];

  // STATE C: Tidak ada program aktif → CTA ke builder
  if (!plan.hasPlan || !plan.activeProgram) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* No Program CTA */}
        <div className="bg-surface-container p-8 border-t-4 border-secondary col-span-full max-w-2xl relative overflow-hidden group">
          <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <LayoutGrid className="w-48 h-48" />
          </div>
          <h2 className="font-headline font-black uppercase text-2xl text-secondary mb-3">
            BELUM ADA PROGRAM AKTIF
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-8">
            Rancang jadwal latihan hingga 4 minggu yang akan looping otomatis. Setiap hari sistem akan menampilkan misi yang harus kamu selesaikan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/training/builder"
              className="flex-1 bg-secondary text-black font-headline font-black py-4 uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(213,117,255,0.5)] transition-all"
            >
              <LayoutGrid className="w-5 h-5" />
              BUILD PROGRAM
            </Link>
            <form
              action={async () => {
                "use server";
                await startEmptyWorkout();
              }}
              className="flex-1"
            >
              <button className="w-full border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-headline font-black py-4 uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                <Play className="w-4 h-4" />
                SESI SPONTAN
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const { activeProgram, todaysSchedule } = plan;

  // STATE B: Ada program aktif — tampilkan Misi Hari Ini
  const hasScheduleToday = todaysSchedule.length > 0;

  return (
    <div className="space-y-8">
      {/* Program Info Bar */}
      <div className="bg-surface-container-high border border-outline-variant/20 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">
            PROGRAM AKTIF
          </div>
          <div className="font-headline font-black uppercase text-white">
            {activeProgram.title}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="font-headline font-black text-2xl text-secondary">
              {activeProgram.currentWeek}
            </div>
            <div className="font-headline font-bold text-[9px] uppercase tracking-widest text-on-surface-variant">
              OF {activeProgram.totalWeeks} WK
            </div>
          </div>
          <Link
            href={`/training/builder?edit=${activeProgram.id}`}
            className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white border border-outline-variant/30 px-3 py-2 hover:border-outline-variant transition-colors"
          >
            Edit
          </Link>
          <Link
            href="/training/builder"
            className="font-headline font-bold text-[10px] uppercase tracking-widest text-black bg-primary hover:shadow-[0_0_10px_rgba(142,255,113,0.4)] px-3 py-2 transition-all flex items-center gap-1"
          >
            + Buat Baru
          </Link>
        </div>
      </div>

      {hasScheduleToday ? (
        // Ada jadwal hari ini
        <div>
          <div className="mb-6">
            <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
              {todayName} • Minggu {activeProgram.currentWeek}
            </div>
            <h2 className="font-headline font-black uppercase text-3xl text-white">
              MISI HARI INI
            </h2>
          </div>

          {/* Mission Cards */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {todaysSchedule.map((item: any, i: number) => (
              <div
                key={item.id}
                className="bg-surface-container border-l-4 border-primary p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="font-headline font-black text-3xl text-surface-container-highest select-none w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-headline font-black uppercase text-lg text-white">
                      {item.exercise_library.name}
                    </h3>
                    <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {item.exercise_library.target_muscle} •{" "}
                      {item.exercise_library.scale_type}
                    </p>
                    {item.notes && (
                      <p className="font-body text-xs text-on-surface-variant/70 mt-1 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-headline font-black text-2xl border-b-2 pb-0.5 ${
                    TIER_COLORS[item.target_tier as tier_enum]
                  }`}
                >
                  TIER {item.target_tier}
                </div>
              </div>
            ))}
          </div>

          {/* Start Battle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form
              action={async () => {
                "use server";
                const exerciseIds = todaysSchedule.map((s: any) => s.exercise_id);
                await startWorkoutFromPlan(exerciseIds);
              }}
              className="flex-1"
            >
              <button className="w-full bg-secondary text-black font-headline font-black py-5 uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(213,117,255,0.6)] transition-all glitch-effect text-lg">
                <Swords className="w-6 h-6 fill-current" />
                MULAI PERTARUNGAN
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await startEmptyWorkout();
              }}
            >
              <button className="w-full sm:w-auto border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-headline font-black py-5 px-8 uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                <Plus className="w-4 h-4" />
                BONUS SESI
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Program aktif tapi hari ini = REST DAY
        <div className="bg-surface-container border border-outline-variant/20 p-10 text-center">
          <div className="text-6xl mb-4">😴</div>
          <h2 className="font-headline font-black uppercase text-2xl text-white mb-2">
            REST DAY
          </h2>
          <p className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest mb-8">
            {todayName} tidak ada jadwal di program ini. Recovery is part of the grind.
          </p>
          <form
            action={async () => {
              "use server";
              await startEmptyWorkout();
            }}
          >
            <button className="border-2 border-dashed border-secondary text-secondary hover:bg-secondary/10 font-headline font-black uppercase text-sm px-8 py-4 tracking-widest transition-all">
              + BONUS SESI SPONTAN
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
