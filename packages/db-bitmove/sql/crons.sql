-- =============================================================================
-- BITMOVE DB — crons.sql
-- PostgreSQL-specific layer (pg_cron). 
-- Saat migrasi keluar Supabase → ganti dengan Vercel Cron / QStash / external
-- scheduler yang call endpoint API, logicnya dipindah ke app layer.
-- Jalankan via Supabase SQL Editor setelah triggers.sql sudah dieksekusi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAIN CRON: handle_smart_global_reset
-- Jadwal: setiap jam (0 * * * *)
-- Alasan per jam bukan per hari: user beda timezone, reset harus tepat
-- di tengah malam waktu mereka masing-masing.
--
-- Urutan eksekusi:
--   1. Kumpulkan user yang perlu di-reset hari ini (by timezone)
--   2. Punishment: Full Skip, Missed High Task, Missed Medium Task, Missed Workout
--   3. Evaluasi streak: hitung completion rate kemarin
--   4. Streak bonus kalau >= 80%
--   5. Update streak_days + last_reset_date di profiles
--   6. Reset daily tasks (is_completed → false, current_value → 0)
--   7. Reset weekly tasks (setiap Senin)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_smart_global_reset()
RETURNS void AS $$
BEGIN
  -- Silent mode: trigger handle_task_completion tidak fire selama reset ini
  PERFORM set_config('bitmove.is_resetting', 'true', true);

  -- ============================================================
  -- STEP 1: Kumpulkan user yang perlu di-reset hari ini
  -- ============================================================
  CREATE TEMP TABLE temp_users ON COMMIT DROP AS
  SELECT
    user_id,
    streak_days,
    streak_max,
    last_activity_date,
    timezone
  FROM public.profiles
  WHERE (NOW() AT TIME ZONE COALESCE(timezone, 'Asia/Jakarta'))::date > last_reset_date;

  -- Tidak ada yang perlu di-reset, selesai
  IF (SELECT COUNT(*) FROM temp_users) = 0 THEN
    RETURN;
  END IF;

  -- ============================================================
  -- STEP 2: Hitung stats kemarin per user
  -- ============================================================
  CREATE TEMP TABLE temp_stats ON COMMIT DROP AS
  SELECT
    u.user_id,
    u.streak_days,
    u.streak_max,
    u.last_activity_date,
    u.timezone,

    -- Total item yang harus dikerjakan kemarin (task + workout schedule)
    COALESCE(td.total_tasks, 0) + COALESCE(sch.has_schedule, 0)       AS total_items,

    -- Total item yang berhasil dikerjakan kemarin
    COALESCE(td.completed_tasks, 0) + COALESCE(wo.has_workout, 0)     AS completed_items,

    -- Untuk punishment
    COALESCE(td.missed_high,   0) AS missed_high_count,
    COALESCE(td.missed_medium, 0) AS missed_medium_count,

    -- Untuk punishment workout
    COALESCE(sch.has_schedule, 0) AS has_schedule,
    COALESCE(wo.has_workout,   0) AS has_workout

  FROM temp_users u

  -- ── Daily task stats ──────────────────────────────────────────────────────
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)                                                                   AS total_tasks,
      COUNT(*) FILTER (WHERE is_completed = true)                               AS completed_tasks,
      COUNT(*) FILTER (WHERE priority = 'High'   AND is_completed = false)      AS missed_high,
      COUNT(*) FILTER (WHERE priority = 'Medium' AND is_completed = false)      AS missed_medium
    FROM public.tasks
    WHERE user_id = u.user_id
      AND frequency = 'Daily'
  ) td ON true

  -- ── Cek jadwal workout kemarin (rotation modulo defined_weeks) ────────────
  LEFT JOIN LATERAL (
    SELECT 1 AS has_schedule
    FROM public.training_programs tp
    JOIN public.program_schedules ps
      ON  ps.program_id  = tp.id
      AND ps.day_of_week = EXTRACT(ISODOW FROM (
            (NOW() AT TIME ZONE COALESCE(u.timezone, 'Asia/Jakarta'))::date - interval '1 day'
          ))
      -- Rotation logic: template week = modulo defined_weeks
      AND ps.week_number = (
            FLOOR(
              EXTRACT(DAY FROM (
                (NOW() AT TIME ZONE COALESCE(u.timezone, 'Asia/Jakarta'))::date
                - interval '1 day'
                - tp.start_date::timestamp
              ))::numeric / 7
            )::int % tp.defined_weeks
          ) + 1
    WHERE tp.user_id  = u.user_id
      AND tp.is_active = true
    LIMIT 1
  ) sch ON true

  -- ── Cek workout yang selesai kemarin ─────────────────────────────────────
  LEFT JOIN LATERAL (
    SELECT 1 AS has_workout
    FROM public.workouts w
    WHERE w.user_id = u.user_id
      AND w.status  = 'COMPLETED'
      AND (w.ended_at AT TIME ZONE COALESCE(u.timezone, 'Asia/Jakarta'))::date
          = ((NOW() AT TIME ZONE COALESCE(u.timezone, 'Asia/Jakarta'))::date - interval '1 day')::date
    LIMIT 1
  ) wo ON true;

  -- ============================================================
  -- STEP 3: PUNISHMENT
  -- Punishment tidak kena streak multiplier.
  -- ============================================================

  -- A. Full Skip Day: tidak ada aktivitas sama sekali kemarin
  INSERT INTO public.point_logs
    (user_id, xp_change, points_change, source_type, description)
  SELECT
    user_id, -100, -200, 'punishment', 'Full Skip Day Penalty 😭'
  FROM temp_stats
  WHERE last_activity_date IS NULL
     OR last_activity_date < (
          (NOW() AT TIME ZONE COALESCE(timezone, 'Asia/Jakarta'))::date - 1
        );

  -- B. Missed High Priority Tasks (per task yang dilewat)
  INSERT INTO public.point_logs
    (user_id, xp_change, points_change, source_type, description)
  SELECT
    user_id,
    -50  * missed_high_count,
    -100 * missed_high_count,
    'punishment',
    'Missed ' || missed_high_count || ' High Priority Task(s) 😤'
  FROM temp_stats
  WHERE missed_high_count > 0;

  -- C. Missed Medium Priority Tasks (per task yang dilewat)
  INSERT INTO public.point_logs
    (user_id, xp_change, points_change, source_type, description)
  SELECT
    user_id,
    -25 * missed_medium_count,
    -50 * missed_medium_count,
    'punishment',
    'Missed ' || missed_medium_count || ' Medium Priority Task(s)'
  FROM temp_stats
  WHERE missed_medium_count > 0;

  -- D. Missed Scheduled Workout (ada jadwal tapi tidak workout)
  INSERT INTO public.point_logs
    (user_id, xp_change, points_change, source_type, description)
  SELECT
    user_id, -150, -50, 'punishment', 'Missed Scheduled Workout! Pemalas! 😤'
  FROM temp_stats
  WHERE has_schedule = 1
    AND has_workout  = 0;

  -- ============================================================
  -- STEP 4: EVALUASI STREAK
  -- Streak naik: total_items > 0 DAN completed >= 80%
  -- Streak reset: total_items = 0 ATAU completed < 80%
  -- Hari kosong (tidak ada task maupun jadwal) = otomatis reset
  -- ============================================================

  -- Streak bonus kalau lolos 80%
  INSERT INTO public.point_logs
    (user_id, xp_change, points_change, source_type, description)
  SELECT
    user_id, 20, 5, 'streak_bonus', 'Daily Streak Achieved! 🔥'
  FROM temp_stats
  WHERE total_items > 0
    AND (completed_items::float / total_items::float) >= 0.8;

  -- Update streak_days, streak_max, last_reset_date
  UPDATE public.profiles p
  SET
    streak_days = CASE
      WHEN s.total_items > 0
        AND (s.completed_items::float / s.total_items::float) >= 0.8
      THEN s.streak_days + 1
      ELSE 0   -- total_items = 0 atau < 80% → reset
    END,

    streak_max = GREATEST(
      s.streak_max,
      CASE
        WHEN s.total_items > 0
          AND (s.completed_items::float / s.total_items::float) >= 0.8
        THEN s.streak_days + 1
        ELSE s.streak_days
      END
    ),

    last_reset_date = (NOW() AT TIME ZONE COALESCE(s.timezone, 'Asia/Jakarta'))::date

  FROM temp_stats s
  WHERE p.user_id = s.user_id;

  -- ============================================================
  -- STEP 5: RESET DAILY TASKS
  -- ============================================================
  UPDATE public.tasks
  SET
    is_completed      = false,
    current_value     = 0,
    last_completed_at = NULL
  WHERE frequency = 'Daily'
    AND user_id IN (SELECT user_id FROM temp_users);

  -- ============================================================
  -- STEP 6: RESET WEEKLY TASKS (setiap Senin, ISODOW = 1)
  -- ============================================================
  UPDATE public.tasks t
  SET
    is_completed      = false,
    current_value     = 0,
    last_completed_at = NULL
  FROM public.profiles p
  WHERE t.user_id   = p.user_id
    AND t.frequency = 'Weekly'
    AND EXTRACT(ISODOW FROM (NOW() AT TIME ZONE COALESCE(p.timezone, 'Asia/Jakarta'))::date) = 1
    AND (NOW() AT TIME ZONE COALESCE(p.timezone, 'Asia/Jakarta'))::date > p.last_weekly_reset;

  UPDATE public.profiles
  SET last_weekly_reset = (NOW() AT TIME ZONE COALESCE(timezone, 'Asia/Jakarta'))::date
  WHERE EXTRACT(ISODOW FROM (NOW() AT TIME ZONE COALESCE(timezone, 'Asia/Jakarta'))::date) = 1
    AND (NOW() AT TIME ZONE COALESCE(timezone, 'Asia/Jakarta'))::date > last_weekly_reset;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- JADWALKAN CRON
-- Unschedule dulu kalau sudah ada, baru schedule ulang — aman untuk re-run.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('bitmove-hourly-reset');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Tidak ada yang perlu di-unschedule, lanjut
  END;

  PERFORM cron.schedule(
    'bitmove-hourly-reset',   -- nama job
    '0 * * * *',              -- setiap jam tepat
    'SELECT public.handle_smart_global_reset()'
  );
END $$;

-- -----------------------------------------------------------------------------
-- CATATAN MIGRASI
-- Saat pindah dari Supabase ke DB lain yang tidak support pg_cron:
--   1. Hapus file crons.sql ini
--   2. Pindahkan logic handle_smart_global_reset ke app layer (TypeScript)
--   3. Jadwalkan via Vercel Cron (vercel.json) atau QStash
--   4. Endpoint API memanggil function TS yang ekuivalen
-- Logic bisnis di queries/ tidak perlu diubah sama sekali.
-- -----------------------------------------------------------------------------
