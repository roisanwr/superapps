import { NextResponse } from "next/server";
import { getTodayWorkoutPlan } from "@/lib/services/workoutService";
import { validateMobileToken } from "@/lib/services/authService";

export async function GET(req: Request) {
  const userId = await validateMobileToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Akses Ditolak" }, { status: 401 });
  }

  const plan = await getTodayWorkoutPlan(userId);
  return NextResponse.json(plan);
}
