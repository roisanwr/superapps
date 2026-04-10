import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

  const expectedSecret = process.env.AUTH_SECRET;
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized. Provide ?secret=YOUR_SECRET" },
      { status: 401 }
    );
  }

  try {
    // ─── Step 1: Beri bonus passive XP untuk Forbidden tasks yang berhasil ditahan ───
    // Cari semua task NEGATIVE yang tidak dicentang hari ini (is_completed = false)
    const allResisted = await prisma.tasks.findMany({
      where: {
        polarity: "NEGATIVE",
        is_completed: false,
      },
      select: {
        id: true,
        user_id: true,
        title: true,
        priority: true,
      }
    });

    if (allResisted.length > 0) {
      // Group by user_id
      const byUser = allResisted.reduce<Record<string, typeof allResisted>>((acc, t) => {
        if (!acc[t.user_id]) acc[t.user_id] = [];
        acc[t.user_id].push(t);
        return acc;
      }, {});

      // Untuk setiap user, hitung total bonus XP dari task yang berhasil ditahan
      for (const [userId, tasks] of Object.entries(byUser)) {
        const totalXpBonus = tasks.reduce((sum, t) => {
          const bonus = t.priority === "High" ? 50 : t.priority === "Medium" ? 25 : 10;
          return sum + bonus;
        }, 0);

        await prisma.$transaction([
          // Catat di point_logs
          prisma.point_logs.create({
            data: {
              user_id: userId,
              xp_change: totalXpBonus,
              points_change: 0,
              source_type: "RESISTANCE_BONUS",
              description: `Resisted ${tasks.length} forbidden protocol(s) — bonus XP awarded`,
            }
          }),
          // Update profil langsung
          prisma.$executeRaw`
            UPDATE profiles
            SET
              current_xp = current_xp + ${totalXpBonus},
              updated_at = NOW()
            WHERE id = ${userId}::uuid
          `,
        ]);
      }
    }

    // ─── Step 2: Jalankan stored procedure reset harian ───
    await prisma.$executeRawUnsafe(
      `SELECT public.handle_smart_global_reset()`
    );

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
