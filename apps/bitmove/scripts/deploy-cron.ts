// Script untuk men-deploy ulang fungsi Cron handle_smart_global_reset ke database
// jalankan: npx tsx scripts/deploy-cron.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🚀 Deploying updated handle_smart_global_reset...");

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.handle_smart_global_reset() RETURNS void AS $$
    BEGIN
        -- STEP 1: Kumpulkan user yang butuh di-reset HARI INI berdasarkan zona waktu mereka
        CREATE TEMP TABLE temp_users_to_reset ON COMMIT DROP AS
        SELECT id, streak_current, streak_max, last_active_date, timezone
        FROM public.profiles
        WHERE (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date > last_reset_date;

        IF (SELECT count(*) FROM temp_users_to_reset) > 0 THEN
            
            -- =====================================================================
            -- STEP 2: EKSEKUSI HUKUMAN (PUNISHMENT) HARDCORE ASLI MILIKMU ⚔️
            -- =====================================================================
            
            -- A. Macro Punishment (-200) untuk Full Skip Day
            INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
            SELECT u.id, 0, -200, 'punishment', 'Full Skip Day Penalty 😭'
            FROM temp_users_to_reset u
            WHERE u.last_active_date < ((now() AT TIME ZONE coalesce(u.timezone, 'Asia/Jakarta'))::date - 1);

            -- B. Micro Punishment (-50) untuk setiap Task "High" yang dilewatkan
            INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
            SELECT t.user_id, 0, -50, 'punishment', 'Missed High Task: ' || t.title
            FROM public.tasks t
            JOIN temp_users_to_reset u ON u.id = t.user_id
            WHERE t.frequency = 'Daily' 
              AND t.priority = 'High' 
              AND t.is_completed = false;

            -- =====================================================================
            -- STEP 3: EVALUASI STREAK & BONUS GABUNGAN 🏆 (Daily Quests + Training)
            -- =====================================================================
            
            -- Kumpulkan metrik gabungan (Quests + Workouts) ke dalam temp table
            CREATE TEMP TABLE temp_user_stats ON COMMIT DROP AS
            SELECT u.id as user_id, 
                   u.streak_current,
                   u.streak_max,
                   u.last_active_date,
                   u.timezone,
                   COUNT(t.id) + COALESCE(sched.has_schedule, 0) as total_items,
                   COALESCE(
                       (COUNT(CASE WHEN t.is_completed THEN 1 END) + COALESCE(wact.has_workout, 0))::float / 
                       NULLIF(COUNT(t.id) + COALESCE(sched.has_schedule, 0), 0)::float, 
                       0.0
                   ) as completion_rate,
                   COALESCE(sched.has_schedule, 0) as has_schedule,
                   COALESCE(wact.has_workout, 0) as has_workout
            FROM temp_users_to_reset u
            LEFT JOIN public.tasks t ON t.user_id = u.id AND t.frequency = 'Daily'
            -- Cek apakah user punya jadwal workout di hari sebelum reset (kemarin)
            LEFT JOIN LATERAL (
                SELECT 1 as has_schedule
                FROM public.training_programs tp
                JOIN public.program_schedules ps ON ps.program_id = tp.id
                    AND ps.day_of_week = EXTRACT(ISODOW FROM ((now() AT TIME ZONE coalesce(u.timezone, 'Asia/Jakarta'))::date - interval '1 day'))
                    AND ps.week_number = (
                        FLOOR(
                            EXTRACT(DAY FROM (
                                ((now() AT TIME ZONE coalesce(u.timezone, 'Asia/Jakarta'))::date - interval '1 day') - tp.start_date::timestamp
                            ))::numeric / 7
                        )::int % tp.total_weeks
                    ) + 1
                WHERE tp.user_id = u.id AND tp.is_active = true
                LIMIT 1
            ) sched ON true
            -- Cek apakah user beneran melakukan workout yang 'completed' di hari sebelum reset (kemarin)
            LEFT JOIN LATERAL (
                SELECT 1 as has_workout
                FROM public.workouts w
                WHERE w.user_id = u.id
                  AND w.status = 'completed'
                  AND (w.ended_at AT TIME ZONE coalesce(u.timezone, 'Asia/Jakarta'))::date = 
                      ((now() AT TIME ZONE coalesce(u.timezone, 'Asia/Jakarta'))::date - interval '1 day')::date
                LIMIT 1
            ) wact ON true
            GROUP BY u.id, u.streak_current, u.streak_max, u.last_active_date, u.timezone, sched.has_schedule, wact.has_workout;

            -- Bonus Streak (+20 XP, +5 Points) jika Load > 0 & >= 80% completion rate (Quests + Training)
            INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
            SELECT user_id, 20, 5, 'streak_bonus', 'Daily Target Achieved (+80%)! Great job!'
            FROM temp_user_stats
            WHERE total_items > 0 AND completion_rate >= 0.8;

            -- UPDATE Profil: Streak & last_reset_date
            UPDATE public.profiles p
            SET 
                streak_current = CASE 
                    WHEN stats.last_active_date < ((now() AT TIME ZONE coalesce(stats.timezone, 'Asia/Jakarta'))::date - interval '1 day')::date THEN 0
                    WHEN stats.total_items > 0 AND stats.completion_rate >= 0.8 THEN stats.streak_current + 1 
                    WHEN stats.total_items > 0 AND stats.completion_rate < 0.8 THEN 0
                    ELSE stats.streak_current END, -- Pause logic jika total_items = 0
                streak_max = GREATEST(stats.streak_max, CASE WHEN stats.total_items > 0 AND stats.completion_rate >= 0.8 THEN stats.streak_current + 1 ELSE stats.streak_current END),
                last_reset_date = (now() AT TIME ZONE coalesce(stats.timezone, 'Asia/Jakarta'))::date
            FROM temp_user_stats stats
            WHERE p.id = stats.user_id;

            -- =====================================================================
            -- STEP 4: BERSIHKAN TASK HARIAN
            -- =====================================================================
            UPDATE public.tasks 
            SET is_completed = false, current_value = 0, last_completed_at = null
            WHERE frequency = 'Daily' AND user_id IN (SELECT id FROM temp_users_to_reset);

            -- =====================================================================
            -- STEP 5: HUKUMAN BOLOS TRAINING WORKOUT ⚔️
            -- Misal: User schedule ada, tapi actual workout nggak ada
            -- =====================================================================
            INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
            SELECT DISTINCT user_id, -150, -50, 'punishment', 'Missed Scheduled Workout! Pemalas! 😤'
            FROM temp_user_stats
            WHERE has_schedule = 1 AND has_workout = 0;

        END IF;

        -- =====================================================================
        -- STEP 6: LOGIC MINGGUAN (RESET HARI SENIN)
        -- =====================================================================
        UPDATE public.tasks t
        SET is_completed = false, current_value = 0, last_completed_at = null
        FROM public.profiles p
        WHERE t.user_id = p.id 
          AND t.frequency = 'Weekly'
          AND EXTRACT(ISODOW FROM (now() AT TIME ZONE coalesce(p.timezone, 'Asia/Jakarta'))::date) = 1
          AND (now() AT TIME ZONE coalesce(p.timezone, 'Asia/Jakarta'))::date > p.last_weekly_reset;

        UPDATE public.profiles
        SET last_weekly_reset = (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date
        WHERE EXTRACT(ISODOW FROM (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date) = 1
          AND (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date > last_weekly_reset;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  console.log("✅ Cron function updated successfully!");

  // Deploy cron schedule
  console.log("⏰ Scheduling hourly cron job...");
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        BEGIN
            PERFORM cron.unschedule('hourly-smart-global-reset');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        PERFORM cron.schedule(
            'hourly-smart-global-reset',
            '0 * * * *',
            'SELECT public.handle_smart_global_reset()'
        );
    END $$;
  `);
  console.log("✅ Cron schedule registered: runs every hour at :00");

  // Verify
  const jobs = await prisma.$queryRawUnsafe(`SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'hourly-smart-global-reset'`);
  console.log("📋 Registered cron jobs:", jobs);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
