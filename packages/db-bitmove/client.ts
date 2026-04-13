// ============================================================
// @woilaa/db-bitmove — Drizzle Client (bitmovedb)
//
// Koneksi ke database quests menggunakan postgres-js driver.
// Pakai singleton pattern untuk menghindari koneksi berlebih
// saat Next.js hot reload di development.
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const globalForDb = globalThis as unknown as {
  bitmoveDbClient: ReturnType<typeof postgres>;
};

const client =
  globalForDb.bitmoveDbClient ??
  postgres(process.env.BITMOVE_DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.bitmoveDbClient = client;
}

export const db = drizzle(client, { schema });
