// ============================================================
// @woilaa/db-auth — Barrel Export
// Import semua kebutuhan DB Auth dari satu titik ini.
//
// Usage di app lain:
// import { users, getUserById, createSession } from "@woilaa/db-auth";
// ============================================================

// Schema & Types
export * from "./schema/schema";

// Queries — App Access (SSO middleware)
export * from "./queries/appAccess";

// Queries — Users
export * from "./queries/users";

// Queries — Sessions
export * from "./queries/sessions";

// Drizzle client (dipakai jika app butuh akses db instance langsung)
export { db } from "./client";
