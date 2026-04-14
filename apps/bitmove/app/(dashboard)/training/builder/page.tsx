import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { exerciseLibrary } from "@woilaa/db-bitmove";
import { eq, asc } from "drizzle-orm";
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
  const user = await requireUser().catch(() => null);
  if (!user?.sub) return <div>Unauthorized Access.</div>;

  const { edit } = await searchParams;

  const [exercises, programs, initialProgram] = await Promise.all([
    db.query.exerciseLibrary.findMany({
      where: eq(exerciseLibrary.isArchived, false),
      orderBy: [asc(exerciseLibrary.name)],
    }),
    getProgramsForUser(user.sub),
    edit ? getProgramById(edit, user.sub) : Promise.resolve(null),
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

      <BuilderUI key={initialProgram?.id ?? 'new'} exercises={exercises as any} initialProgram={initialProgram as any} />

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
                  p.isActive ? "border-secondary" : "border-outline-variant/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                     <h3 className="font-headline font-black text-base uppercase text-white truncate">
                      {p.title}
                    </h3>
                    {p.isActive && (
                      <span className="shrink-0 text-[9px] font-headline font-black uppercase tracking-widest text-secondary border border-secondary px-2 py-0.5">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {p.totalWeeks} MINGGU • {p.schedules.length} SLOT LATIHAN
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/training/builder?edit=${p.id}`}
                      className="text-on-surface-variant hover:text-white transition-colors p-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <ProgramActionButtons programId={p.id} programTitle={p.title} isActive={p.isActive ?? false} />
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
