CREATE TYPE "public"."point_log_source_enum" AS ENUM('task', 'workout', 'streak_bonus', 'punishment');--> statement-breakpoint
CREATE TYPE "public"."scale_type_enum" AS ENUM('endurance', 'strength', 'power', 'static_hold', 'cardio_run', 'mobility');--> statement-breakpoint
CREATE TYPE "public"."task_frequency" AS ENUM('Daily', 'Weekly', 'OneTime');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."task_type_enum" AS ENUM('CHECKBOX', 'PROGRESS');--> statement-breakpoint
CREATE TYPE "public"."tier_enum" AS ENUM('D', 'C', 'B', 'A', 'S', 'SS');--> statement-breakpoint
CREATE TYPE "public"."workout_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "difficulty_scales" (
	"scale_type" "scale_type_enum" NOT NULL,
	"tier" "tier_enum" NOT NULL,
	"target_value" integer NOT NULL,
	CONSTRAINT "difficulty_scales_scale_type_tier_pk" PRIMARY KEY("scale_type","tier")
);
--> statement-breakpoint
CREATE TABLE "exercise_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"target_muscle" text,
	"scale_type" "scale_type_enum" NOT NULL,
	"measurement_unit" text DEFAULT 'reps' NOT NULL,
	"image_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "level_rules" (
	"level" integer PRIMARY KEY NOT NULL,
	"min_xp" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"xp_change" integer DEFAULT 0 NOT NULL,
	"points_change" integer DEFAULT 0 NOT NULL,
	"source_type" "point_log_source_enum" NOT NULL,
	"reference_id" uuid,
	"reversed_log_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_xp" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"current_points" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"streak_max" integer DEFAULT 0 NOT NULL,
	"tier" "tier_enum" DEFAULT 'D' NOT NULL,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"last_activity_date" date,
	"last_reset_date" date DEFAULT CURRENT_DATE - 1,
	"last_weekly_reset" date DEFAULT CURRENT_DATE - 7,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"exercise_id" uuid NOT NULL,
	"target_tier" "tier_enum" NOT NULL,
	"target_sets" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"emoji" text,
	"price" integer NOT NULL,
	"is_redeemed" boolean DEFAULT false NOT NULL,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"tier" "tier_enum" NOT NULL,
	"target_value" integer NOT NULL,
	"completed_value" integer,
	"weight_kg" double precision DEFAULT 0,
	"is_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"default_priority" "task_priority" DEFAULT 'Medium' NOT NULL,
	"default_frequency" "task_frequency" DEFAULT 'Daily' NOT NULL,
	"default_task_type" "task_type_enum" DEFAULT 'CHECKBOX' NOT NULL,
	"default_target_value" integer DEFAULT 1 NOT NULL,
	"default_unit" text DEFAULT 'Checklist' NOT NULL,
	"icon_emoji" text,
	"polarity" text DEFAULT 'POSITIVE' NOT NULL,
	"punishment_xp" integer,
	"punishment_points" integer
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"library_id" uuid,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"priority" "task_priority" DEFAULT 'Medium' NOT NULL,
	"frequency" "task_frequency" DEFAULT 'Daily' NOT NULL,
	"task_type" "task_type_enum" DEFAULT 'CHECKBOX' NOT NULL,
	"target_value" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'Checklist' NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"last_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"polarity" text DEFAULT 'POSITIVE' NOT NULL,
	"punishment_xp" integer,
	"punishment_points" integer
);
--> statement-breakpoint
CREATE TABLE "tier_rewards" (
	"tier" "tier_enum" PRIMARY KEY NOT NULL,
	"xp_reward" integer NOT NULL,
	"points_reward" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"total_weeks" integer NOT NULL,
	"defined_weeks" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" date DEFAULT CURRENT_DATE NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"status" "workout_status_enum" DEFAULT 'IN_PROGRESS' NOT NULL,
	"total_xp_earned" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "exercise_library" ADD CONSTRAINT "exercise_library_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_logs" ADD CONSTRAINT "point_logs_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_schedules" ADD CONSTRAINT "program_schedules_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_schedules" ADD CONSTRAINT "program_schedules_exercise_id_exercise_library_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_library"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_library_id_task_library_id_fk" FOREIGN KEY ("library_id") REFERENCES "public"."task_library"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_exercise_library_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_point_logs_user" ON "point_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_point_logs_ref" ON "point_logs" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_level" ON "profiles" USING btree ("current_level");--> statement-breakpoint
CREATE INDEX "idx_program_schedules_program" ON "program_schedules" USING btree ("program_id","week_number","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_freq" ON "tasks" USING btree ("user_id","frequency","is_completed");--> statement-breakpoint
CREATE INDEX "idx_training_programs_user_active" ON "training_programs" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_workouts_user" ON "workouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workouts_user_status" ON "workouts" USING btree ("user_id","status");