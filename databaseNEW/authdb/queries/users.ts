import { eq, or } from "drizzle-orm";
import { db } from "../client";
import { users, appAccess } from "../schema/schema";
import type { NewUser } from "../schema/schema";

// ============================================================
// CREATE
// ============================================================

/**
 * Membuat user baru + auto-grant akses ke semua app saat register.
 *
 * TODO: Hapus auto-grant appAccess di sini ketika approval flow
 * by admin diimplementasikan. Ganti dengan endpoint admin khusus.
 */
export async function createUser(data: NewUser) {
  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(data).returning();

    // Auto-grant akses ke semua app (current behavior)
    await tx.insert(appAccess).values([
      { userId: user.id, appName: "mykanz", isGranted: true },
      { userId: user.id, appName: "bitmove", isGranted: true },
    ]);

    return user;
  });
}

// ============================================================
// READ
// ============================================================

/**
 * Cari user by ID — dipakai untuk verifikasi token & fetch profile
 */
export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}

/**
 * Cari user by email atau username — dipakai saat login
 * Support login dengan email atau username sesuai keputusan arsitektur
 */
export async function getUserByIdentifier(identifier: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);

  return user ?? null;
}

/**
 * Cek apakah email sudah terdaftar — dipakai saat register
 */
export async function isEmailTaken(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return !!user;
}

/**
 * Cek apakah username sudah terdaftar — dipakai saat register
 */
export async function isUsernameTaken(username: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return !!user;
}

// ============================================================
// UPDATE
// ============================================================

/**
 * Update profile user — name dan image saja yang boleh diubah user sendiri
 * Email & username butuh flow verifikasi terpisah (belum diimplementasikan)
 */
export async function updateUserProfile(
  id: string,
  data: { name?: string; image?: string }
) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Update password hash — dipanggil setelah validasi password lama
 */
export async function updatePasswordHash(id: string, passwordHash: string) {
  const [updated] = await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return updated ?? null;
}

// ============================================================
// DELETE (Soft Delete via isActive flag)
// Hard delete tidak disarankan — pakai isActive = false
// ============================================================

/**
 * Deactivate user — soft delete, data tetap ada di DB
 * Sessions terkait akan auto-cascade delete karena FK onDelete: cascade
 */
export async function deactivateUser(id: string) {
  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return updated ?? null;
}
