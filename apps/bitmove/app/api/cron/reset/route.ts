import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, pointLogs, profiles } from "@woilaa/db-bitmove";
import { eq, and, sql } from "drizzle-orm";

/**
 * API Fallback untuk trigger reset harian secara manual atau via external cron.
 *
 * Penggunaan:
 * - GET /api/cron/reset?secret=YOUR_SECRET
 *
 * Bisa dipanggil oleh:
 * - Vercel Cron
 * - External cron service (cron-job.org, etc.)
 * - Manual trigger dari admin
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.JWT_SECRET; // Switched to JWT_SECRET
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized. Provide ?secret=YOUR_SECRET" },
      { status: 401 }
    );
  }

  try {
    // ─── Step 1: Beri bonus passive XP untuk Forbidden tasks yang berhasil ditahan ───
    // Cari semua task NEGATIVE yang tidak dicentang hari ini (is_completed = false)
    const allResisted = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        title: tasks.title,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.polarity, "NEGATIVE"),
          eq(tasks.isCompleted, false)
        )
      );

    if (allResisted.length > 0) {
      // Group by userId
      const byUser = allResisted.reduce<Record<string, typeof allResisted>>(
        (acc, t) => {
          if (!acc[t.userId]) acc[t.userId] = [];
          acc[t.userId].push(t);
          return acc;
        },
        {}
      );

      // Untuk setiap user, hitung total bonus XP dari task yang berhasil ditahan
      for (const [userId, userTasks] of Object.entries(byUser)) {
        const totalXpBonus = userTasks.reduce((sum, t) => {
          const bonus =
            t.priority === "High" ? 50 : t.priority === "Medium" ? 25 : 10;
          return sum + bonus;
        }, 0);

        await db.transaction(async (tx) => {
          // Catat di pointLogs
          await tx.insert(pointLogs).values({
            userId,
            xpChange: totalXpBonus,
            pointsChange: 0,
            sourceType: "punishment", // closest available enum value
            description: `Resisted ${userTasks.length} forbidden protocol(s) — bonus XP awarded`,
          });

          // Update profil langsung
          await tx
            .update(profiles)
            .set({
              currentXp: sql`${profiles.currentXp} + ${totalXpBonus}`,
              updatedAt: new Date(),
            })
            .where(eq(profiles.userId, userId));
        });
      }
    }

    // ─── Step 2: Jalankan stored procedure reset harian ───
    await db.execute(sql`SELECT public.handle_smart_global_reset()`);

    return NextResponse.json({
      success: true,
      message: "Daily reset executed successfully",
      resistance_bonuses_awarded: allResisted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Cron reset API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
