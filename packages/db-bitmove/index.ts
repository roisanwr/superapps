// =============================================================================
// index.ts — Barrel file untuk package @woilaa/db-bitmove
// Import semua dari sini, tidak perlu tahu struktur folder dalam.
//
// Usage:
//   import { getProfileById, cloneTaskFromLibrary, startWorkout } from "@woilaa/db-bitmove"
// =============================================================================

// Schema & Types
export * from "./schema/schema";

// Queries
export * from "./queries/profiles";
export * from "./queries/tasks";
export * from "./queries/workouts";
export * from "./queries/programs";
export * from "./queries/rewards";
export * from "./queries/gamification";

// Drizzle client
export { db } from "./client";
