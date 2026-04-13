import { eq, sql } from "drizzle-orm";
import { db } from "../client";
import { profiles, type Profile, type NewProfile } from "../schema/schema";

// =============================================================================
// profiles.ts — CRUD untuk tabel profiles
// user_id di-pass dari JWT payload, tidak ada auth logic di sini.
// =============================================================================

// -----------------------------------------------------------------------------
// CREATE
// Dipanggil saat user pertama kali akses Bitmove setelah register di Auth DB.
// -----------------------------------------------------------------------------
export async function createProfile(
  userId: string,
  timezone: string = "Asia/Jakarta"
): Promise<Profile> {
  const [profile] = await db
    .insert(profiles)
    .values({ userId, timezone })
    .returning();
  return profile;
}

// -----------------------------------------------------------------------------
// READ
// -----------------------------------------------------------------------------
export async function getProfileById(userId: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return profile ?? null;
}

// Dipakai untuk cek apakah profile sudah ada sebelum create
export async function profileExists(userId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return Number(result.count) > 0;
}

// -----------------------------------------------------------------------------
// UPDATE
// -----------------------------------------------------------------------------

// Update timezone — dipanggil dari settings user
export async function updateTimezone(
  userId: string,
  timezone: string
): Promise<Profile | null> {
  const [updated] = await db
    .update(profiles)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning();
  return updated ?? null;
}

// Redeem reward: potong points sebesar price
// Validasi saldo dilakukan di app layer sebelum memanggil ini
export async function deductPoints(
  userId: string,
  amount: integer
): Promise<Profile | null> {
  const [updated] = await db
    .update(profiles)
    .set({
      // Floor di 0 — tidak bisa minus (double safety, utamanya di trigger DB)
      currentPoints: sql`GREATEST(0, ${profiles.currentPoints} - ${amount})`,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId))
    .returning();
  return updated ?? null;
}

// =============================================================================
// TYPE HELPERS
// =============================================================================
type integer = number;
