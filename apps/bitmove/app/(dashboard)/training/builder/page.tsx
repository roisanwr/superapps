import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BuilderUI } from "./BuilderUI";
import { getProgramsForUser, getProgramById } from "@/lib/services/programService";
import { removeProgramAction, setActiveProgramAction } from "./actions";
import { Trash2, ArrowLeft, Pencil, Zap } from "lucide-react";
import { ProgramActionButtons } from "./ProgramActionButtons";
import Link from "next/link";

export const metadata = {
  title: "PROGRAM BUILDER | BITMOVE",
};

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return <div>Unauthorized Access.</div>;

  const { edit } = await searchParams;

  const [exercises, programs, initialProgram] = await Promise.all([
    prisma.exercise_library.findMany({
      where: { is_archived: false },
      orderBy: { name: "asc" },
    }),
    getProgramsForUser(session.user.id),
    edit ? getProgramById(edit, session.user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        <Link
          href="/training"
          className="inline-flex items-center gap-2 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Kembali ke Training Ground
        </Link>
      </div>

      <BuilderUI key={initialProgram?.id ?? 'new'} exercises={exercises} initialProgram={initialProgram} />

      {/* Existing Programs */}
      {programs.length > 0 && (
        <div className="mt-16">
          <h2 className="font-headline font-black text-xl uppercase tracking-widest text-on-surface-variant mb-4 border-b border-outline-variant/30 pb-4">
            PROGRAM TERSIMPAN
          </h2>
          <div className="space-y-3">
            {programs.map((p) => (
              <div
                key={p.id}
                className={`bg-surface-container p-5 flex items-center justify-between gap-4 border-l-4 ${
                  p.is_active ? "border-secondary" : "border-outline-variant/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-headline font-black text-base uppercase text-white truncate">
                      {p.title}
                    </h3>
                    {p.is_active && (
                      <span className="shrink-0 text-[9px] font-headline font-black uppercase tracking-widest text-secondary border border-secondary px-2 py-0.5">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {p.total_weeks} MINGGU • {p.program_schedules.length} SLOT LATIHAN
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/training/builder?edit=${p.id}`}
                      className="text-on-surface-variant hover:text-white transition-colors p-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <ProgramActionButtons programId={p.id} programTitle={p.title} isActive={p.is_active ?? false} />
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
