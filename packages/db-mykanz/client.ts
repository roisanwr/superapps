// ============================================================
// @woilaa/db-mykanz — Drizzle Client (mykanzdb)
//
// Koneksi ke database finance menggunakan postgres-js driver.
// Pakai singleton pattern untuk menghindari koneksi berlebih
// saat Next.js hot reload di development.
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const globalForDb = globalThis as unknown as {
  mykanzDbClient: ReturnType<typeof postgres>;
};

const client =
  globalForDb.mykanzDbClient ??
  postgres(process.env.MYKANZ_DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.mykanzDbClient = client;
}

export const db = drizzle(client, { schema });
