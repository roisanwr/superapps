-- =============================================================================
-- BITMOVE DB — indexes.sql
-- PostgreSQL-specific layer. Ganti file ini saat migrasi ke DB lain.
-- Jalankan via Supabase SQL Editor atau migration script.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------

-- Cron reset: cari user yang last_reset_date-nya sudah lewat
CREATE INDEX IF NOT EXISTS idx_profiles_reset
  ON public.profiles (last_reset_date, timezone);

-- Leaderboard / sort by level
CREATE INDEX IF NOT EXISTS idx_profiles_level
  ON public.profiles (current_level DESC);

-- Streak leaderboard
CREATE INDEX IF NOT EXISTS idx_profiles_streak
  ON public.profiles (streak_days DESC);

-- -----------------------------------------------------------------------------
-- POINT LOGS
-- -----------------------------------------------------------------------------

-- Query history log per user (paling sering dipakai)
CREATE INDEX IF NOT EXISTS idx_point_logs_user
  ON public.point_logs (user_id, created_at DESC);

-- Traceability: cari log berdasarkan source task/set/workout
CREATE INDEX IF NOT EXISTS idx_point_logs_reference
  ON public.point_logs (reference_id)
  WHERE reference_id IS NOT NULL;

-- Audit trail undo: cari reversed log
CREATE INDEX IF NOT EXISTS idx_point_logs_reversed
  ON public.point_logs (reversed_log_id)
  WHERE reversed_log_id IS NOT NULL;

-- Filter by source type (punishment history, streak bonus, dll)
CREATE INDEX IF NOT EXISTS idx_point_logs_source
  ON public.point_logs (user_id, source_type);

-- -----------------------------------------------------------------------------
-- TASKS
-- -----------------------------------------------------------------------------

-- Query paling sering: ambil daily tasks user yang belum selesai
CREATE INDEX IF NOT EXISTS idx_tasks_user_freq
  ON public.tasks (user_id, frequency, is_completed);

-- Cron reset: ambil semua daily tasks per user
CREATE INDEX IF NOT EXISTS idx_tasks_daily_reset
  ON public.tasks (user_id, frequency)
  WHERE frequency = 'Daily';

-- Cron reset: ambil weekly tasks (reset tiap Senin)
CREATE INDEX IF NOT EXISTS idx_tasks_weekly_reset
  ON public.tasks (user_id, frequency)
  WHERE frequency = 'Weekly';

-- Punishment: cari missed High/Medium task saat cron
CREATE INDEX IF NOT EXISTS idx_tasks_missed_priority
  ON public.tasks (user_id, priority, is_completed, frequency)
  WHERE is_completed = false AND frequency = 'Daily';

-- -----------------------------------------------------------------------------
-- WORKOUTS
-- -----------------------------------------------------------------------------

-- Query workout aktif / history per user
CREATE INDEX IF NOT EXISTS idx_workouts_user
  ON public.workouts (user_id, started_at DESC);

-- Cron: cek apakah user workout kemarin (filter by status + ended_at)
CREATE INDEX IF NOT EXISTS idx_workouts_completed
  ON public.workouts (user_id, status, ended_at)
  WHERE status = 'COMPLETED';

-- -----------------------------------------------------------------------------
-- WORKOUT EXERCISES & SETS
-- -----------------------------------------------------------------------------

-- Ambil semua exercise dalam satu workout
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
  ON public.workout_exercises (workout_id);

-- Ambil semua set dalam satu workout exercise
CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise
  ON public.sets (workout_exercise_id, set_number);

-- -----------------------------------------------------------------------------
-- EXERCISE LIBRARY
-- -----------------------------------------------------------------------------

-- Filter exercise by scale_type (untuk tier lookup)
CREATE INDEX IF NOT EXISTS idx_exercise_scale_type
  ON public.exercise_library (scale_type)
  WHERE is_archived = false;

-- Exercise custom buatan user
CREATE INDEX IF NOT EXISTS idx_exercise_created_by
  ON public.exercise_library (created_by)
  WHERE created_by IS NOT NULL;

-- -----------------------------------------------------------------------------
-- TRAINING PROGRAMS & SCHEDULES
-- -----------------------------------------------------------------------------

-- Ambil program aktif user (paling sering dipakai)
CREATE INDEX IF NOT EXISTS idx_programs_user_active
  ON public.training_programs (user_id, is_active)
  WHERE is_active = true;

-- Cron: lookup jadwal workout hari ini per program
CREATE INDEX IF NOT EXISTS idx_schedules_program_day
  ON public.program_schedules (program_id, week_number, day_of_week);

-- -----------------------------------------------------------------------------
-- REWARDS
-- -----------------------------------------------------------------------------

-- Ambil rewards user yang belum diredeemed
CREATE INDEX IF NOT EXISTS idx_rewards_user
  ON public.rewards (user_id, is_redeemed);

-- =============================================================================
-- AUTO updated_at TRIGGER (PG-specific, dipisah dari Drizzle layer)
-- Apply ke profiles — satu-satunya tabel dengan updated_at di Bitmove.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
