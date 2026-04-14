import { NextResponse } from "next/server";
import { getProgramsForUser, createAndActivateProgram, type TierEnum } from "@/lib/services/programService";
import { validateMobileToken } from "@/lib/services/authService";

export async function GET(req: Request) {
  const userId = await validateMobileToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Akses Ditolak" }, { status: 401 });
  }

  const programs = await getProgramsForUser(userId);
  return NextResponse.json(programs);
}

export async function POST(req: Request) {
  const userId = await validateMobileToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Akses Ditolak" }, { status: 401 });
  }

  const body = await req.json();
  const { title, totalWeeks, slots } = body;

  if (!title || !totalWeeks || !Array.isArray(slots)) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const program = await createAndActivateProgram(userId, {
    title,
    totalWeeks,
    slots: slots.map((s: any) => ({
      exerciseId: s.exerciseId,
      weekNumber: s.weekNumber,
      dayOfWeek: s.dayOfWeek,
      targetTier: s.targetTier as TierEnum,
      notes: s.notes,
    })),
  });

  return NextResponse.json(program, { status: 201 });
}
