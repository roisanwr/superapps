// lib/auth-db.ts
// Re-export Drizzle db instance untuk authdb
// Usage: import { authDb } from "@/lib/auth-db"

import { db } from "@woilaa/db-auth";
export { db as authDb };
