import { eq, and } from "drizzle-orm";
import { db } from "../client";
import { appAccess } from "../schema/schema";
import type { NewAppAccess } from "../schema/schema";

// ============================================================
// READ
// ============================================================

/**
 * Cek apakah user punya akses ke app tertentu.
 * Dipakai di SSO middleware setiap app (Mykanz, Bitmove).
 *
 * Return null jika tidak ada row → tolak akses.
 * Return row dengan isGranted = false → akses dicabut oleh admin.
 * Return row dengan isGranted = true → akses valid.
 */
export async function getAppAccess(
  userId: string,
  appName: "mykanz" | "bitmove"
) {
  const [access] = await db
    .select()
    .from(appAccess)
    .where(
      and(
        eq(appAccess.userId, userId),
        eq(appAccess.appName, appName)
      )
    )
    .limit(1);

  return access ?? null;
}

/**
 * Cek semua akses yang dimiliki user — dipakai saat build JWT payload.
 * JWT akan menyertakan daftar app yang bisa diakses user.
 */
export async function getAllAppAccessByUserId(userId: string) {
  return await db
    .select()
    .from(appAccess)
    .where(eq(appAccess.userId, userId));
}

// ============================================================
// GRANT & REVOKE
// ============================================================

/**
 * Grant akses user ke app tertentu.
 *
 * CURRENT BEHAVIOR: dipanggil otomatis di createUser() saat register.
 * TODO: Ketika approval flow diimplementasikan, pindahkan pemanggilan
 * function ini ke endpoint admin khusus — tidak lagi auto saat register.
 */
export async function grantAppAccess(
  userId: string,
  appName: "mykanz" | "bitmove"
) {
  const [access] = await db
    .insert(appAccess)
    .values({ userId, appName, isGranted: true })
    // Jika row sudah ada (unique constraint), update isGranted jadi true
    .onConflictDoUpdate({
      target: [appAccess.userId, appAccess.appName],
      set: { isGranted: true, grantedAt: new Date() },
    })
    .returning();

  return access;
}

/**
 * Revoke akses user ke app tertentu — dipanggil oleh admin.
 * Tidak hard delete row — set isGranted = false supaya audit trail tetap ada.
 *
 * TODO: Aktifkan ini ketika approval flow by admin diimplementasikan.
 */
export async function revokeAppAccess(
  userId: string,
  appName: "mykanz" | "bitmove"
) {
  const [access] = await db
    .update(appAccess)
    .set({ isGranted: false })
    .where(
      and(
        eq(appAccess.userId, userId),
        eq(appAccess.appName, appName)
      )
    )
    .returning({ id: appAccess.id });

  return access ?? null;
}
