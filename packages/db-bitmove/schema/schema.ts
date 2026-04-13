import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =============================================================================
// ENUMS
// =============================================================================

// scale_type: jenis skala untuk exercise difficulty
export const scaleTypeEnum = pgEnum("scale_type_enum", [
  "endurance",
  "strength",
  "power",
  "static_hold",
  "cardio_run",
  "mobility",
]);

// task_frequency: seberapa sering task harus dikerjakan
export const taskFrequencyEnum = pgEnum("task_frequency", [
  "Daily",
  "Weekly",
  "OneTime",
]);

// task_priority: prioritas task, menentukan base XP/points reward
export const taskPriorityEnum = pgEnum("task_priority", [
  "Low",
  "Medium",
  "High",
]);

// task_type: CHECKBOX = langsung centang, PROGRESS = input nilai
export const taskTypeEnum = pgEnum("task_type_enum", [
  "CHECKBOX",
  "PROGRESS",
]);

// tier_enum: tier performa untuk workout sets
export const tierEnum = pgEnum("tier_enum", ["D", "C", "B", "A", "S", "SS"]);

// workout_status: status sesi workout
export const workoutStatusEnum = pgEnum("workout_status_enum", [
  "IN_PROGRESS",
  "COMPLETED",
]);

// point_log_source: sumber dari setiap perubahan XP/points
export const pointLogSourceEnum = pgEnum("point_log_source_enum", [
  "task",
  "workout",
  "streak_bonus",
  "punishment",
]);

// =============================================================================
// PROFILES
// Auth columns (username, password_hash, role) sudah dipindah ke Auth DB.
// user_id adalah UUID yang di-share dari Auth DB via JWT — no FK lintas DB.
// =============================================================================

export const profiles = pgTable(
  "profiles",
  {
    // Reference ke Auth DB — by convention, no FK
    userId: uuid("user_id").primaryKey(),

    // Gamification stats
    currentXp: integer("current_xp").notNull().default(0),
    totalXp: integer("total_xp").notNull().default(0),
    currentLevel: integer("current_level").notNull().default(1),
    currentPoints: integer("current_points").notNull().default(0),
    totalPointsEarned: integer("total_points_earned").notNull().default(0),

    // Streak
    streakDays: integer("streak_days").notNull().default(0),
    streakMax: integer("streak_max").notNull().default(0),

    // Tier RPG (D, C, B, A, S, SS) — update manual atau lewat milestone
    tier: tierEnum("tier").notNull().default("D"),

    // Timezone untuk kalkulasi reset harian yang akurat
    timezone: text("timezone").notNull().default("Asia/Jakarta"),

    // Tanggal tracking untuk cron reset
    lastActivityDate: date("last_activity_date"),
    lastResetDate: date("last_reset_date").default(sql`CURRENT_DATE - 1`),
    lastWeeklyReset: date("last_weekly_reset").default(sql`CURRENT_DATE - 7`),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxProfilesLevel: index("idx_profiles_level").on(t.currentLevel),
  })
);

// =============================================================================
// LEVEL RULES
// Static lookup table. Full 1–50 di-seed manual.
// Title di-handle di app layer berdasarkan range level.
// =============================================================================

export const levelRules = pgTable("level_rules", {
  level: integer("level").primaryKey(),
  minXp: integer("min_xp").notNull(),
  // title tidak disimpan di sini — handled di logic app via range
});

// =============================================================================
// TIER REWARDS
// Reward XP/points berdasarkan tier workout set yang dicapai.
// =============================================================================

export const tierRewards = pgTable("tier_rewards", {
  tier: tierEnum("tier").primaryKey(),
  xpReward: integer("xp_reward").notNull(),
  pointsReward: integer("points_reward").notNull(),
});

// =============================================================================
// POINT LOGS
// Ledger immutable untuk semua perubahan XP/points.
// Undo menggunakan reversed_log_id yang menunjuk ke log original.
// =============================================================================

export const pointLogs = pgTable(
  "point_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),

    xpChange: integer("xp_change").notNull().default(0),
    pointsChange: integer("points_change").notNull().default(0),
    sourceType: pointLogSourceEnum("source_type").notNull(),

    // Traceability: task_id / workout_exercise_id / set_id yang jadi sumber
    referenceId: uuid("reference_id"),

    // Audit trail undo: menunjuk ke log original yang di-reverse
    reversedLogId: uuid("reversed_log_id"),

    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxPointLogsUser: index("idx_point_logs_user").on(t.userId),
    idxPointLogsRef: index("idx_point_logs_ref").on(t.referenceId),
  })
);

// =============================================================================
// TASK LIBRARY
// Template task bawaan sistem. User tidak bisa buat task dari nol —
// semua task harus di-clone dari sini.
// =============================================================================

export const taskLibrary = pgTable("task_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),

  // Free text — biar bisa custom, tidak dijadikan enum
  category: text("category").notNull(),

  defaultPriority: taskPriorityEnum("default_priority")
    .notNull()
    .default("Medium"),
  defaultFrequency: taskFrequencyEnum("default_frequency")
    .notNull()
    .default("Daily"),
  defaultTaskType: taskTypeEnum("default_task_type")
    .notNull()
    .default("CHECKBOX"),

  // Hanya relevan kalau task_type = PROGRESS
  defaultTargetValue: integer("default_target_value").notNull().default(1),
  defaultUnit: text("default_unit").notNull().default("Checklist"),

  iconEmoji: text("icon_emoji"),

  // Polarity: POSITIVE = reward, NEGATIVE = punishment (bad habits)
  polarity: text("polarity").notNull().default("POSITIVE"),

  // Custom punishment untuk negative task (null = tidak berlaku untuk POSITIVE)
  punishmentXp: integer("punishment_xp"),
  punishmentPoints: integer("punishment_points"),
});

// =============================================================================
// TASKS
// Task milik user, di-clone dari task_library.
// is_custom dihapus — semua task wajib dari library.
// =============================================================================

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),

    // Di-clone dari task_library
    libraryId: uuid("library_id").references(() => taskLibrary.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    category: text("category").notNull(),
    priority: taskPriorityEnum("priority").notNull().default("Medium"),
    frequency: taskFrequencyEnum("frequency").notNull().default("Daily"),
    taskType: taskTypeEnum("task_type").notNull().default("CHECKBOX"),

    // Progress tracking — aktif hanya kalau task_type = PROGRESS
    // Untuk CHECKBOX: target_value = 1, current_value di-set 1 saat complete
    targetValue: integer("target_value").notNull().default(1),
    unit: text("unit").notNull().default("Checklist"),
    currentValue: integer("current_value").notNull().default(0),

    isCompleted: boolean("is_completed").notNull().default(false),
    lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Polarity: POSITIVE / NEGATIVE
    polarity: text("polarity").notNull().default("POSITIVE"),

    // Custom punishment — hanya aktif kalau polarity = NEGATIVE
    punishmentXp: integer("punishment_xp"),
    punishmentPoints: integer("punishment_points"),
  },
  (t) => ({
    idxTasksUserFreq: index("idx_tasks_user_freq").on(
      t.userId,
      t.frequency,
      t.isCompleted
    ),
  })
);

// =============================================================================
// WORKOUTS
// Satu sesi workout per record. Status hanya IN_PROGRESS atau COMPLETED.
// CANCELLED dihapus — kalau tidak selesai, record dibiarkan IN_PROGRESS.
// =============================================================================

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    status: workoutStatusEnum("status").notNull().default("IN_PROGRESS"),

    totalXpEarned: integer("total_xp_earned").notNull().default(0),
    totalPointsEarned: integer("total_points_earned").notNull().default(0),
    notes: text("notes"),
  },
  (t) => ({
    idxWorkoutsUser: index("idx_workouts_user").on(t.userId),
    idxWorkoutsStatus: index("idx_workouts_user_status").on(
      t.userId,
      t.status
    ),
  })
);

// =============================================================================
// EXERCISE LIBRARY
// 51 exercise bawaan sistem + custom exercise buatan user.
// created_by null = exercise sistem, ada UUID = exercise custom user.
// =============================================================================

export const exerciseLibrary = pgTable("exercise_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  targetMuscle: text("target_muscle"),
  scaleType: scaleTypeEnum("scale_type").notNull(),

  // Satuan pengukuran: reps, seconds, meters, dll
  measurementUnit: text("measurement_unit").notNull().default("reps"),

  imageUrl: text("image_url"),
  isArchived: boolean("is_archived").notNull().default(false),

  // null = exercise sistem (global), UUID = exercise custom user (private)
  createdBy: uuid("created_by").references(() => profiles.userId, {
    onDelete: "cascade",
  }),
});

// =============================================================================
// DIFFICULTY SCALES
// Lookup table tier threshold per scale_type.
// Dipakai untuk auto-assign tier dari completed_value di app layer.
// =============================================================================

export const difficultyScales = pgTable(
  "difficulty_scales",
  {
    scaleType: scaleTypeEnum("scale_type").notNull(),
    tier: tierEnum("tier").notNull(),
    targetValue: integer("target_value").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.scaleType, t.tier] }),
  })
);

// =============================================================================
// WORKOUT EXERCISES
// Junction table: satu workout bisa punya banyak exercise.
// =============================================================================

export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exerciseLibrary.id, { onDelete: "cascade" }),
  notes: text("notes"),
});

// =============================================================================
// SETS
// Tiap exercise dalam workout punya 1+ set.
// Tier di-assign dari app layer berdasarkan completed_value vs difficulty_scales.
// weight_kg: default hidden di frontend, toggle opsional.
// =============================================================================

export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutExerciseId: uuid("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),

  setNumber: integer("set_number").notNull(),

  // Tier yang dicapai — di-assign app layer dari completed_value vs difficulty_scales
  tier: tierEnum("tier").notNull(),

  // target dari program schedule (opsional), actual dari user
  targetValue: integer("target_value").notNull(),
  completedValue: integer("completed_value"),

  // Default hidden di frontend, toggle opsional
  weightKg: doublePrecision("weight_kg").default(0),

  isCompleted: boolean("is_completed").notNull().default(false),
});

// =============================================================================
// TRAINING PROGRAMS
// Program latihan user. Hanya 1 yang is_active = true per user.
// defined_weeks: jumlah minggu unik yang didefinisikan user.
// total_weeks: total durasi program (bisa lebih dari defined_weeks).
// Rotation: actual_week = ((current_week - 1) % defined_weeks) + 1
// =============================================================================

export const trainingPrograms = pgTable(
  "training_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),

    title: text("title").notNull(),

    // Total durasi program
    totalWeeks: integer("total_weeks").notNull(),

    // Jumlah minggu unik yang didefinisikan — untuk rotation modulo
    // Kalau semua minggu sama, cukup isi 1 minggu saja
    definedWeeks: integer("defined_weeks").notNull().default(1),

    isActive: boolean("is_active").notNull().default(true),
    startDate: date("start_date").notNull().default(sql`CURRENT_DATE`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxProgramsUserActive: index("idx_training_programs_user_active").on(
      t.userId,
      t.isActive
    ),
  })
);

// =============================================================================
// PROGRAM SCHEDULES
// Flat schedule per exercise per hari per minggu template.
// week_number merujuk ke template week (max = defined_weeks), bukan actual week.
// day_of_week: 1 = Senin, 7 = Minggu (ISO standard).
// target_sets: opsional, actual bisa berbeda saat workout.
// =============================================================================

export const programSchedules = pgTable(
  "program_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: "cascade" }),

    // Template week number (1 s/d defined_weeks)
    weekNumber: integer("week_number").notNull(),

    // 1 = Senin, 7 = Minggu
    dayOfWeek: integer("day_of_week").notNull(),

    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exerciseLibrary.id),

    targetTier: tierEnum("target_tier").notNull(),

    // Opsional — kalau null, user tentukan sendiri saat workout
    targetSets: integer("target_sets"),

    notes: text("notes"),
  },
  (t) => ({
    idxSchedulesProgram: index("idx_program_schedules_program").on(
      t.programId,
      t.weekNumber,
      t.dayOfWeek
    ),
  })
);

// =============================================================================
// REWARDS
// Reward custom buatan user, diredeem pakai points.
// Validasi points cukup di app layer.
// =============================================================================

export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  price: integer("price").notNull(),

  isRedeemed: boolean("is_redeemed").notNull().default(false),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// =============================================================================
// RELATIONS (untuk Drizzle query API)
// =============================================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  pointLogs: many(pointLogs),
  tasks: many(tasks),
  workouts: many(workouts),
  trainingPrograms: many(trainingPrograms),
  rewards: many(rewards),
  customExercises: many(exerciseLibrary),
}));

export const pointLogsRelations = relations(pointLogs, ({ one }) => ({
  profile: one(profiles, {
    fields: [pointLogs.userId],
    references: [profiles.userId],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  profile: one(profiles, {
    fields: [tasks.userId],
    references: [profiles.userId],
  }),
  library: one(taskLibrary, {
    fields: [tasks.libraryId],
    references: [taskLibrary.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [workouts.userId],
    references: [profiles.userId],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exerciseLibrary, {
      fields: [workoutExercises.exerciseId],
      references: [exerciseLibrary.id],
    }),
    sets: many(sets),
  })
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const trainingProgramsRelations = relations(
  trainingPrograms,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [trainingPrograms.userId],
      references: [profiles.userId],
    }),
    schedules: many(programSchedules),
  })
);

export const programSchedulesRelations = relations(
  programSchedules,
  ({ one }) => ({
    program: one(trainingPrograms, {
      fields: [programSchedules.programId],
      references: [trainingPrograms.id],
    }),
    exercise: one(exerciseLibrary, {
      fields: [programSchedules.exerciseId],
      references: [exerciseLibrary.id],
    }),
  })
);

export const rewardsRelations = relations(rewards, ({ one }) => ({
  profile: one(profiles, {
    fields: [rewards.userId],
    references: [profiles.userId],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// Dipakai di queries/ — tidak perlu define type manual
// =============================================================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type PointLog = typeof pointLogs.$inferSelect;
export type NewPointLog = typeof pointLogs.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskLibrary = typeof taskLibrary.$inferSelect;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;

export type ExerciseLibrary = typeof exerciseLibrary.$inferSelect;
export type NewExerciseLibrary = typeof exerciseLibrary.$inferInsert;

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type NewTrainingProgram = typeof trainingPrograms.$inferInsert;

export type ProgramSchedule = typeof programSchedules.$inferSelect;
export type NewProgramSchedule = typeof programSchedules.$inferInsert;

export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
