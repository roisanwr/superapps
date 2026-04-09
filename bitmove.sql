-- =================================================================================
-- 🚀 SPARKY'S OPTIMIZED SUPABASE RPG SCHEMA (CUSTOM AUTH - FINAL MASTERPIECE)
-- =================================================================================

-- 1. SETUP EXTENSIONS & SCHEMAS
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CUSTOM TYPES (ENUMS)
DO $$ BEGIN
    CREATE TYPE public.scale_type_enum AS ENUM ('endurance', 'strength', 'power', 'static_hold', 'cardio_run', 'mobility');
    CREATE TYPE public.task_frequency AS ENUM ('Daily', 'Weekly', 'OneTime');
    CREATE TYPE public.task_priority AS ENUM ('Low', 'Medium', 'High');
    CREATE TYPE public.tier_enum AS ENUM ('D', 'C', 'B', 'A', 'S', 'SS');
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =================================================================================
-- 3. TABLES CREATION (Dengan ON DELETE CASCADE & Tanpa auth.users)
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE, 
    password_hash text,
    full_name text,
    avatar_url text,
    role public.user_role DEFAULT 'user'::public.user_role,
    timezone text DEFAULT 'Asia/Jakarta'::text,
    level integer DEFAULT 1,
    current_xp integer DEFAULT 0,
    current_points integer DEFAULT 0,
    streak_current integer DEFAULT 0,
    streak_max integer DEFAULT 0,
    last_active_date date,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    last_reset_date date DEFAULT (CURRENT_DATE - 1),
    last_weekly_reset date DEFAULT (CURRENT_DATE - 7)
);

CREATE TABLE IF NOT EXISTS public.point_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_change integer DEFAULT 0,
    points_change integer DEFAULT 0,
    source_type text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text NOT NULL,
    priority public.task_priority DEFAULT 'Medium'::public.task_priority,
    frequency public.task_frequency DEFAULT 'Daily'::public.task_frequency,
    target_value integer DEFAULT 1,
    unit text DEFAULT 'Checklist'::text,
    current_value integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    last_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_custom boolean DEFAULT false,
    polarity TEXT NOT NULL DEFAULT 'POSITIVE'
);

CREATE TABLE IF NOT EXISTS public.workouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ended_at timestamp with time zone,
    status text DEFAULT 'in_progress'::text,
    total_xp_earned integer DEFAULT 0,
    total_points_earned integer DEFAULT 0,
    notes text
);

CREATE TABLE IF NOT EXISTS public.rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    price integer NOT NULL,
    image_url text,
    is_redeemed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.level_rules (
    level integer PRIMARY KEY,
    min_xp integer NOT NULL,
    title text
);

CREATE TABLE IF NOT EXISTS public.task_library (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text NOT NULL,
    default_priority public.task_priority DEFAULT 'Medium'::public.task_priority,
    default_frequency public.task_frequency DEFAULT 'Daily'::public.task_frequency,
    default_target_value integer DEFAULT 1,
    default_unit text DEFAULT 'Checklist'::text,
    icon_emoji text,
    polarity TEXT NOT NULL DEFAULT 'POSITIVE'
);

-- ================== EKOSISTEM WORKOUT / GYM ================== --

CREATE TABLE IF NOT EXISTS public.difficulty_scales (
    scale_type public.scale_type_enum NOT NULL,
    tier public.tier_enum NOT NULL,
    target_value integer NOT NULL,
    PRIMARY KEY (scale_type, tier)
);

CREATE TABLE IF NOT EXISTS public.tier_rewards (
    tier public.tier_enum PRIMARY KEY,
    xp_reward integer NOT NULL,
    points_reward integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exercise_library (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    target_muscle text,
    scale_type public.scale_type_enum NOT NULL,
    measurement_unit text DEFAULT 'reps'::text,
    image_url text,
    is_archived boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
    notes text
);

CREATE TABLE IF NOT EXISTS public.sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number integer NOT NULL,
    tier public.tier_enum NOT NULL,
    target_value integer NOT NULL,
    completed_value integer,
    weight_kg double precision DEFAULT 0,
    is_completed boolean DEFAULT false
);

-- ================== EKOSISTEM PROGRAM LATIHAN (WORKOUT PLAYLIST) ================== --

CREATE TABLE IF NOT EXISTS public.training_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_weeks integer NOT NULL,
    is_active boolean DEFAULT true,
    start_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.program_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
    week_number integer NOT NULL,
    day_of_week integer NOT NULL,
    exercise_id uuid NOT NULL REFERENCES public.exercise_library(id),
    target_tier public.tier_enum NOT NULL,
    notes text
);

-- =================================================================================
-- 4. DATABASE INDEXING ⚡
-- =================================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_freq ON public.tasks(user_id, frequency, is_completed);
CREATE INDEX IF NOT EXISTS idx_point_logs_user ON public.point_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);
CREATE INDEX IF NOT EXISTS idx_workouts_user ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_user_active ON public.training_programs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_program_schedules_program ON public.program_schedules(program_id, week_number, day_of_week);

-- =================================================================================
-- 5. OPTIMIZED FUNCTIONS & TRIGGERS
-- =================================================================================

-- Fitur: Otomatis update kolom updated_at di profile
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Fitur: Kalkulasi Reward
CREATE OR REPLACE FUNCTION public.calculate_task_reward(p_priority public.task_priority, p_frequency public.task_frequency, p_is_custom boolean) RETURNS jsonb AS $$
DECLARE
    xp_val int := 0; points_val int := 0; multiplier int := 1;
BEGIN
    IF p_frequency = 'Weekly' THEN multiplier := 2; END IF;
    CASE p_priority
        WHEN 'High' THEN xp_val := 50; points_val := 15;
        WHEN 'Medium' THEN xp_val := 30; points_val := 10;
        ELSE xp_val := 10; points_val := 5;
    END CASE;
    IF p_is_custom = true THEN
        xp_val := GREATEST(1, xp_val / 2); 
        points_val := GREATEST(1, points_val / 2);
    END IF;
    RETURN jsonb_build_object('xp', xp_val * multiplier, 'points', points_val * multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fitur: Trigger saat Task Selesai/Di-Undo (dengan fitur "tutup mata" saat reset sistem)
CREATE OR REPLACE FUNCTION public.handle_task_completion() RETURNS TRIGGER AS $$
DECLARE
    reward_data jsonb;
    is_system_reset text;
BEGIN
    -- 🕵️‍♂️ CEK TANDA PENGENAL: Apakah aksi ini dilakukan oleh Cron Job?
    is_system_reset := current_setting('bitmove.is_resetting', true);
    
    -- Jika ini dari cron reset, LANGSUNG KELUAR! Abaikan logika nambah/ngurangin point!
    IF is_system_reset = 'true' THEN
        RETURN NEW;
    END IF;

    -- Logika normal saat USER manual klik complete / undo
    IF (NEW.is_completed = true AND OLD.is_completed = false) THEN
        reward_data := public.calculate_task_reward(NEW.priority, NEW.frequency, NEW.is_custom);
        INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
        VALUES (NEW.user_id, (reward_data->>'xp')::int, (reward_data->>'points')::int, 'task', 'Completed: ' || NEW.title);
    ELSIF (NEW.is_completed = false AND OLD.is_completed = true) THEN
        reward_data := public.calculate_task_reward(NEW.priority, NEW.frequency, NEW.is_custom);
        INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
        VALUES (NEW.user_id, -(reward_data->>'xp')::int, -(reward_data->>'points')::int, 'task', 'Undo: ' || NEW.title);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_completion ON public.tasks;
CREATE TRIGGER on_task_completion
AFTER UPDATE OF is_completed ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_completion();

-- Fitur: Game Stats Processing (Level Up Logic & FIXED TIMEZONE BUG)
CREATE OR REPLACE FUNCTION public.process_game_stats() RETURNS trigger AS $$
DECLARE
    new_level int;
BEGIN
    UPDATE public.profiles
    SET 
        current_points = current_points + NEW.points_change,
        current_xp = current_xp + NEW.xp_change,
        last_active_date = CASE 
            WHEN NEW.xp_change > 0 THEN (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date 
            ELSE last_active_date 
        END
    WHERE id = NEW.user_id;

    SELECT level INTO new_level FROM public.level_rules 
    WHERE min_xp <= (SELECT current_xp FROM public.profiles WHERE id = NEW.user_id)
    ORDER BY level DESC LIMIT 1;

    UPDATE public.profiles SET level = GREATEST(level, new_level) WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_log_added ON public.point_logs;
CREATE TRIGGER on_log_added
AFTER INSERT ON public.point_logs
FOR EACH ROW EXECUTE FUNCTION public.process_game_stats();

-- =================================================================================
-- 6. THE MEGA OPTIMIZED CRON JOB (Set-Based Operation) 🔥
-- =================================================================================
CREATE OR REPLACE FUNCTION public.handle_smart_global_reset() RETURNS void AS $$
BEGIN
    -- 🤫 AKTIFKAN MODE SILENT: Beritahu seluruh sistem database bahwa kita sedang melakukan Reset Global
    PERFORM set_config('bitmove.is_resetting', 'true', true);

    -- STEP 1: Kumpulkan user yang butuh di-reset HARI INI berdasarkan zona waktu mereka
    CREATE TEMP TABLE temp_users_to_reset ON COMMIT DROP AS
    SELECT id, streak_current, streak_max, last_active_date, timezone
    FROM public.profiles
    WHERE (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date > last_reset_date;

    IF (SELECT count(*) FROM temp_users_to_reset) > 0 THEN
        
        -- =====================================================================
        -- STEP 2: EKSEKUSI HUKUMAN (PUNISHMENT) ⚔️
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

        -- Bonus Streak (+20 XP, +5 Points) jika Load > 0 & >= 80% completion rate
        INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
        SELECT user_id, 20, 5, 'streak_bonus', 'Daily Target Achieved (+80%)! Great job!'
        FROM temp_user_stats
        WHERE total_items > 0 AND completion_rate >= 0.8;

        -- UPDATE Profil: Streak & last_reset_date
        UPDATE public.profiles p
        SET 
            streak_current = CASE 
                WHEN stats.last_active_date < ((now() AT TIME ZONE coalesce(stats.timezone, 'Asia/Jakarta'))::date - 1) THEN 0
                WHEN stats.total_items > 0 AND stats.completion_rate >= 0.8 THEN stats.streak_current + 1 
                WHEN stats.total_items > 0 AND stats.completion_rate < 0.8 THEN 0
                ELSE stats.streak_current END,
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
        -- =====================================================================
        INSERT INTO public.point_logs (user_id, xp_change, points_change, source_type, description)
        SELECT DISTINCT user_id, -150, -50, 'punishment', 'Missed Scheduled Workout! Pemalas! 😤'
        FROM temp_user_stats
        WHERE has_schedule = 1 AND COALESCE(has_workout, 0) = 0;

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

-- Penjadwalan Cron yang aman
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

-- =================================================================================
-- 7. ROW LEVEL SECURITY (RLS) DINONAKTIFKAN (Custom Auth Mode)
-- =================================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_schedules DISABLE ROW LEVEL SECURITY;

-- =================================================================================
-- 8. SEED DATA 🎁
-- =================================================================================

INSERT INTO public.difficulty_scales (scale_type, tier, target_value) VALUES
('endurance','D',15), ('endurance','C',25), ('endurance','B',50), ('endurance','A',75), ('endurance','S',100), ('endurance','SS',150),
('strength','D',10), ('strength','C',15), ('strength','B',25), ('strength','A',40), ('strength','S',60), ('strength','SS',80),
('power','D',3), ('power','C',5), ('power','B',8), ('power','A',12), ('power','S',15), ('power','SS',20),
('static_hold','D',30), ('static_hold','C',45), ('static_hold','B',60), ('static_hold','A',90), ('static_hold','S',120), ('static_hold','SS',180),
('cardio_run','D',500), ('cardio_run','C',1000), ('cardio_run','B',3000), ('cardio_run','A',5000), ('cardio_run','S',10000), ('cardio_run','SS',21000)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_library (id, name, target_muscle, scale_type, measurement_unit, image_url, is_archived, created_by) VALUES
('e85d3189-208c-4a16-837e-401dee267d4c','Push Up klasik','Chest','strength','reps',NULL,false,NULL),
('9a140a43-6e19-44d1-80f1-f5230ad8f6ab','Pull Up','Back','power','reps',NULL,false,NULL),
('8b8892a6-2b7f-4fee-a96b-25feb363fa4c','Squat','Legs','endurance','reps',NULL,false,NULL),
('785459cf-b419-4b68-ab82-9f65be08ae74','Plank','Core','static_hold','seconds',NULL,false,NULL),
('382b049d-91a9-4111-a20e-0156bc369af4','Jogging','Cardio','cardio_run','meters',NULL,false,NULL),
('f91a14e6-382a-42b3-89ab-bc187b31a051','Burpees','Full Body','strength','reps',NULL,false,NULL),
('a1f0c1a1-0001-4a16-837e-401dee267d4c','Incline Push Up','Chest','strength','reps',NULL,false,NULL),
('a1f0c1a1-0002-4a16-837e-401dee267d4c','Decline Push Up','Chest','strength','reps',NULL,false,NULL),
('a1f0c1a1-0003-4a16-837e-401dee267d4c','Diamond Push Up','Chest','strength','reps',NULL,false,NULL),
('a1f0c1a1-0004-4a16-837e-401dee267d4c','Archer Push Up','Chest','strength','reps',NULL,false,NULL),
('a1f0c1a1-0005-4a16-837e-401dee267d4c','Pike Push Up','Shoulders','strength','reps',NULL,false,NULL),
('a1f0c1a1-0006-4a16-837e-401dee267d4c','Elevated Pike Push Up','Shoulders','strength','reps',NULL,false,NULL),
('a1f0c1a1-0007-4a16-837e-401dee267d4c','Pike Push Up Hold','Shoulders','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0008-4a16-837e-401dee267d4c','Triceps Dips','Arms','strength','reps',NULL,false,NULL),
('a1f0c1a1-0009-4a16-837e-401dee267d4c','Bulgarian Split Squat','Legs','strength','reps',NULL,false,NULL),
('a1f0c1a1-0010-4a16-837e-401dee267d4c','Lunge','Legs','strength','reps',NULL,false,NULL),
('a1f0c1a1-0011-4a16-837e-401dee267d4c','Walking Lunge','Legs','endurance','reps',NULL,false,NULL),
('a1f0c1a1-0012-4a16-837e-401dee267d4c','Glute Bridge','Glutes','strength','reps',NULL,false,NULL),
('a1f0c1a1-0013-4a16-837e-401dee267d4c','Single Leg Glute Bridge','Glutes','strength','reps',NULL,false,NULL),
('a1f0c1a1-0014-4a16-837e-401dee267d4c','Donkey Kicks','Glutes','endurance','reps',NULL,false,NULL),
('a1f0c1a1-0015-4a16-837e-401dee267d4c','Calf Raises','Legs','endurance','reps',NULL,false,NULL),
('a1f0c1a1-0016-4a16-837e-401dee267d4c','Wall Sit','Legs','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0017-4a16-837e-401dee267d4c','Superman Row','Back','strength','reps',NULL,false,NULL),
('a1f0c1a1-0018-4a16-837e-401dee267d4c','Leg Raise','Core','strength','reps',NULL,false,NULL),
('a1f0c1a1-0019-4a16-837e-401dee267d4c','Hanging Knee Raise','Core','strength','reps',NULL,false,NULL),
('a1f0c1a1-0020-4a16-837e-401dee267d4c','Sit Up','Core','strength','reps',NULL,false,NULL),
('a1f0c1a1-0021-4a16-837e-401dee267d4c','Bicycle Crunch','Core','endurance','seconds',NULL,false,NULL),
('a1f0c1a1-0022-4a16-837e-401dee267d4c','Russian Twist','Core','endurance','reps',NULL,false,NULL),
('a1f0c1a1-0023-4a16-837e-401dee267d4c','Side Plank Reach Through','Core','strength','reps',NULL,false,NULL),
('a1f0c1a1-0024-4a16-837e-401dee267d4c','Side Plank','Core','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0025-4a16-837e-401dee267d4c','Hollow Body Hold','Core','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0026-4a16-837e-401dee267d4c','Bird Dog','Core','endurance','reps',NULL,false,NULL),
('a1f0c1a1-0027-4a16-837e-401dee267d4c','Dynamic Stretching','Mobility','mobility','seconds',NULL,false,NULL),
('a1f0c1a1-0028-4a16-837e-401dee267d4c','Deep Squat Hold','Mobility','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0029-4a16-837e-401dee267d4c','Shoulder Rolls','Shoulders','mobility','reps',NULL,false,NULL),
('a1f0c1a1-0030-4a16-837e-401dee267d4c','Breathing Exercise','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0031-4a16-837e-401dee267d4c','Bodyweight Row','Back','strength','reps',NULL,false,NULL),
('a1f0c1a1-0032-4a16-837e-401dee267d4c','Chin Up','Back','strength','reps',NULL,false,NULL),
('a1f0c1a1-0033-4a16-837e-401dee267d4c','Muscle Up','Back','power','reps',NULL,false,NULL),
('a1f0c1a1-0034-4a16-837e-401dee267d4c','Front Lever','Back','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0035-4a16-837e-401dee267d4c','Parallel Bar Dips','Chest','strength','reps',NULL,false,NULL),
('a1f0c1a1-0036-4a16-837e-401dee267d4c','Handstand Hold','Shoulders','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0037-4a16-837e-401dee267d4c','Handstand Push Up','Shoulders','strength','reps',NULL,false,NULL),
('a1f0c1a1-0038-4a16-837e-401dee267d4c','L-Sit','Core','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0039-4a16-837e-401dee267d4c','Pistol Squat','Legs','strength','reps',NULL,false,NULL),
('a1f0c1a1-0040-4a16-837e-401dee267d4c','Jumping Jacks','Cardio','endurance','seconds',NULL,false,NULL),
('a1f0c1a1-0041-4a16-837e-401dee267d4c','Mountain Climbers','Cardio','endurance','seconds',NULL,false,NULL),
('a1f0c1a1-0042-4a16-837e-401dee267d4c','Jump Rope','Cardio','endurance','seconds',NULL,false,NULL),
('a1f0c1a1-0043-4a16-837e-401dee267d4c','Box Breathing','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0044-4a16-837e-401dee267d4c','Diaphragmatic Breathing','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0045-4a16-837e-401dee267d4c','4-7-8 Breathing','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0046-4a16-837e-401dee267d4c','Wim Hof Breathing','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0047-4a16-837e-401dee267d4c','Dry Static Apnea','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0048-4a16-837e-401dee267d4c','CO2 Tolerance Table','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0049-4a16-837e-401dee267d4c','O2 Deprivation Table','Recovery','static_hold','seconds',NULL,false,NULL),
('a1f0c1a1-0050-4a16-837e-401dee267d4c','Apnea Walk','Cardio','endurance','meters',NULL,false,NULL),
('a1f0c1a1-0051-4a16-837e-401dee267d4c','Ribcage Expansion Stretch','Mobility','mobility','seconds',NULL,false,NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.level_rules (level, min_xp, title) VALUES
(1,0,'Newbie'), (5,2000,'Beginner'), (10,8000,'Rookie'), (20,30000,'Dedicated'),
(30,100000,'Elite'), (40,250000,'Master'), (50,500000,'Immortal')
ON CONFLICT DO NOTHING;

INSERT INTO public.task_library (id, title, category, default_priority, default_frequency, default_target_value, default_unit, icon_emoji) VALUES
('1315ec83-2516-4a29-acd0-78b16a7af0e6','Baca Buku','Intellect','Medium','Daily',10,'Halaman','🧠'),
('26a78437-a133-4a3e-8260-90dba51c41b7','Belajar Coding','Intellect','High','Daily',60,'Menit','💻'),
('36b8d058-7557-4cde-b957-4d520152de4b','Minum Air 2L','Vitality','High','Daily',1,'Checklist','💧'),
('01661be9-74b8-48ac-9507-508733750640','Tidur 8 Jam','Vitality','High','Daily',1,'Checklist','😴'),
('6d372790-3182-4516-9745-2b8bdda23592','Nabung Harian','Wealth','Medium','Daily',1,'Checklist','💰'),
('2044fca5-2ac4-48c7-8f5c-a6ce97f28bd9','Latihan Bahasa','Charisma','Medium','Daily',15,'Menit','🇬🇧')
ON CONFLICT DO NOTHING;

INSERT INTO public.tier_rewards (tier, xp_reward, points_reward) VALUES
('D',25,5), ('C',50,10), ('B',75,15), ('A',100,20), ('S',150,30), ('SS',200,50)
ON CONFLICT DO NOTHING;

-- DONE! 🎉