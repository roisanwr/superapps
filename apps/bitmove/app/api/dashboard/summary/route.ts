import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles, tasks } from "@woilaa/db-bitmove/schema/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireUser();
    
    // Fetch profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.sub));

    // Fetch today's tasks count
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.sub),
          eq(tasks.isCompleted, false) // Needs real implementation logic
        )
      );

    return NextResponse.json({
      level: profile?.level || 1,
      streak: profile?.currentStreak || 0,
      completedToday: 0, // Placeholder
      totalToday: todayTasks.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
