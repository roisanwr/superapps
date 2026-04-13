-- =============================================================================
-- BITMOVE DB — triggers.sql
-- PostgreSQL-specific layer. Ganti file ini saat migrasi ke DB lain.
-- Jalankan via Supabase SQL Editor atau migration script.
-- Urutan eksekusi penting — jalankan dari atas ke bawah.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPER: Streak multiplier berdasarkan streak_days
-- IMMUTABLE — aman di-cache oleh PG optimizer.
-- Punishment TIDAK melewati multiplier ini.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_streak_multiplier(p_streak integer)
RETURNS numeric AS $$
BEGIN
  RETURN CASE
    WHEN p_streak >= 90 THEN 1.75
    WHEN p_streak >= 60 THEN 1.50
    WHEN p_streak >= 30 THEN 1.35
    WHEN p_streak >= 14 THEN 1.20
    WHEN p_streak >= 7  THEN 1.10
    ELSE 1.0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- HELPER: Kalkulasi task reward
-- completion_pct dikirim dari app layer (0.0 – 1.0).
--   CHECKBOX task → app kirim 1.0
--   PROGRESS task → app set current_value, trigger hitung dari kolom
-- NEGATIVE task tidak melewati function ini — pakai punishment_xp/points.
-- OneTime: ×5 | Weekly: ×2 | Daily: ×1
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_task_reward(
  p_priority      public.task_priority,
  p_frequency     public.task_frequency,
  p_completion_pct numeric
)
RETURNS jsonb AS $$
DECLARE
  xp_val     int := 0;
  pts_val    int := 0;
  multiplier int := 1;
BEGIN
  CASE p_frequency
    WHEN 'OneTime' THEN multiplier := 5;
    WHEN 'Weekly'  THEN multiplier := 2;
    ELSE                multiplier := 1;
  END CASE;

  CASE p_priority
    WHEN 'High'   THEN xp_val := 50; pts_val := 15;
    WHEN 'Medium' THEN xp_val := 30; pts_val := 10;
    ELSE               xp_val := 10; pts_val := 5;
  END CASE;

  RETURN jsonb_build_object(
    'xp',     FLOOR(xp_val  * multiplier * LEAST(1.0, p_completion_pct)),
    'points', FLOOR(pts_val * multiplier * LEAST(1.0, p_completion_pct))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- TRIGGER 1: handle_task_completion
-- Fire setelah UPDATE is_completed pada tabel tasks.
-- Silent saat cron reset (bitmove.is_resetting = 'true').
--
-- Skenario:
--   A. POSITIVE complete → reward × streak_multiplier → insert point_log
--   B. POSITIVE undo     → reverse log original via reversed_log_id
--   C. NEGATIVE complete → punishment custom (punishment_xp/points), no multiplier
--   D. NEGATIVE undo     → reverse punishment log via reversed_log_id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  reward_data  jsonb;
  streak_mult  numeric;
  final_xp     int;
  final_pts    int;
  is_resetting text;
BEGIN
  -- Silent mode: skip semua logic saat cron reset
  is_resetting := current_setting('bitmove.is_resetting', true);
  IF is_resetting = 'true' THEN
    RETURN NEW;
  END IF;

  -- Ambil streak multiplier user saat ini
  SELECT public.get_streak_multiplier(streak_days)
  INTO streak_mult
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- ── A & C: COMPLETE ───────────────────────────────────────────────────────
  IF NEW.is_completed = true AND OLD.is_completed = false THEN

    IF NEW.polarity = 'NEGATIVE' THEN
      -- C. Negative task: punishment custom, tanpa streak multiplier
      INSERT INTO public.point_logs
        (user_id, xp_change, points_change, source_type, reference_id, description)
      VALUES (
        NEW.user_id,
        -(COALESCE(NEW.punishment_xp, 0)),
        -(COALESCE(NEW.punishment_points, 0)),
        'punishment',
        NEW.id,
        'Negative habit done: ' || NEW.title
      );

    ELSE
      -- A. Positive task: reward + streak multiplier
      reward_data := public.calculate_task_reward(
        NEW.priority,
        NEW.frequency,
        NEW.current_value::numeric / NULLIF(NEW.target_value, 0)
      );
      final_xp  := FLOOR((reward_data->>'xp')::numeric  * streak_mult);
      final_pts := FLOOR((reward_data->>'points')::numeric * streak_mult);

      INSERT INTO public.point_logs
        (user_id, xp_change, points_change, source_type, reference_id, description)
      VALUES (
        NEW.user_id,
        final_xp,
        final_pts,
        'task',
        NEW.id,
        'Completed: ' || NEW.title
      );
    END IF;

  -- ── B & D: UNDO ───────────────────────────────────────────────────────────
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN

    IF NEW.polarity = 'NEGATIVE' THEN
      -- D. Undo negative: kembalikan punishment
      INSERT INTO public.point_logs
        (user_id, xp_change, points_change, source_type, reference_id, reversed_log_id, description)
      SELECT
        NEW.user_id,
        COALESCE(NEW.punishment_xp, 0),
        COALESCE(NEW.punishment_points, 0),
        'punishment',
        NEW.id,
        pl.id,
        'Undo negative habit: ' || NEW.title
      FROM public.point_logs pl
      WHERE pl.reference_id = NEW.id
        AND pl.source_type = 'punishment'
      ORDER BY pl.created_at DESC
      LIMIT 1;

    ELSE
      -- B. Undo positive: reverse nilai dari log original
      INSERT INTO public.point_logs
        (user_id, xp_change, points_change, source_type, reference_id, reversed_log_id, description)
      SELECT
        NEW.user_id,
        -(pl.xp_change),
        -(pl.points_change),
        'task',
        NEW.id,
        pl.id,
        'Undo: ' || NEW.title
      FROM public.point_logs pl
      WHERE pl.reference_id = NEW.id
        AND pl.source_type = 'task'
      ORDER BY pl.created_at DESC
      LIMIT 1;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_task_completion ON public.tasks;
CREATE TRIGGER trg_task_completion
AFTER UPDATE OF is_completed ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_completion();

-- -----------------------------------------------------------------------------
-- TRIGGER 2: process_game_stats
-- Fire setelah setiap INSERT ke point_logs.
-- Update current_xp, total_xp, current_points, total_points_earned, level.
-- XP dan points di-floor di 0 — tidak bisa minus.
-- Level mengikuti XP aktual — bisa naik DAN turun.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_game_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_tz   text;
  new_xp    int;
  new_level int;
BEGIN
  -- Ambil timezone untuk last_activity_date
  SELECT timezone INTO user_tz
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Update XP dan points, floor di 0
  UPDATE public.profiles
  SET
    current_xp          = GREATEST(0, current_xp + NEW.xp_change),
    total_xp            = GREATEST(0, total_xp   + NEW.xp_change),
    current_points      = GREATEST(0, current_points       + NEW.points_change),
    total_points_earned = GREATEST(0, total_points_earned  + NEW.points_change),
    last_activity_date  = CASE
      WHEN NEW.xp_change > 0
      THEN (NOW() AT TIME ZONE COALESCE(user_tz, 'Asia/Jakarta'))::date
      ELSE last_activity_date
    END
  WHERE user_id = NEW.user_id;

  -- Ambil XP terbaru untuk kalkulasi level
  SELECT current_xp INTO new_xp
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Level dari XP aktual — bisa turun
  SELECT level INTO new_level
  FROM public.level_rules
  WHERE min_xp <= new_xp
  ORDER BY level DESC
  LIMIT 1;

  UPDATE public.profiles
  SET current_level = COALESCE(new_level, 1)
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_point_log_inserted ON public.point_logs;
CREATE TRIGGER trg_point_log_inserted
AFTER INSERT ON public.point_logs
FOR EACH ROW EXECUTE FUNCTION public.process_game_stats();
