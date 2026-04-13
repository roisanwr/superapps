import { eq, lt, and, sql } from "drizzle-orm";
import { db } from "../client";
import { sessions } from "../schema/schema";
import type { NewSession } from "../schema/schema";

// ============================================================
// CREATE
// ============================================================

/**
 * Simpan refresh token baru ke DB setelah user berhasil login.
 * Dipanggil bersamaan dengan pembuatan access token (JWT).
 *
 * Refresh token disimpan di DB — access token TIDAK disimpan (stateless).
 * Access token hidup di memory client, expire dalam 15 menit.
 * Refresh token hidup di HttpOnly Cookie, expire dalam 30 hari.
 */
export async function createSession(data: NewSession) {
  const [session] = await db.insert(sessions).values(data).returning();
  return session;
}

// ============================================================
// READ
// ============================================================

/**
 * Cari session by refresh token — dipakai saat client request access token baru.
 * Jika tidak ditemukan atau sudah expired, return null → paksa re-login.
 */
export async function getSessionByToken(refreshToken: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, refreshToken))
    .limit(1);

  return session ?? null;
}

/**
 * Ambil semua active session milik user — dipakai untuk halaman "Device Manager".
 * Hanya tampilkan session yang belum expired — session expired tidak relevan untuk user.
 *
 * TODO: Tambahkan field "device_name" di tabel sessions ketika
 * fitur Device Manager diimplementasikan.
 */
export async function getSessionsByUserId(userId: string) {
  return await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        sql`${sessions.expiresAt} > NOW()`
      )
    );
}

// ============================================================
// DELETE
// ============================================================

/**
 * Hapus session by refresh token — dipanggil saat user logout.
 * Menghapus satu session spesifik (logout device ini saja).
 */
export async function deleteSessionByToken(refreshToken: string) {
  const [deleted] = await db
    .delete(sessions)
    .where(eq(sessions.refreshToken, refreshToken))
    .returning({ id: sessions.id });

  return deleted ?? null;
}

/**
 * Hapus semua session milik user — dipanggil saat:
 * - User klik "Logout dari semua device"
 * - Admin deactivate user
 * - User ganti password (paksa re-login semua device)
 */
export async function deleteAllSessionsByUserId(userId: string) {
  return await db
    .delete(sessions)
    .where(eq(sessions.userId, userId))
    .returning({ id: sessions.id });
}

// ============================================================
// MAINTENANCE
// ============================================================

/**
 * Hapus semua session yang sudah expired dari DB.
 * Jalankan ini secara berkala via cron job (lihat crons.sql).
 *
 * CATATAN: Logic cron-nya ada di crons.sql (PG-specific layer).
 * Function ini adalah fallback portable via Drizzle
 * jika cron PG tidak tersedia di DB target saat migrasi.
 */
export async function deleteExpiredSessions() {
  return await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id });
}

/**
 * Cek apakah refresh token masih valid (belum expired).
 * Dipanggil sebelum issue access token baru.
 *
 * Drizzle tidak punya operator gt() untuk timestamp,
 * jadi pakai sql`` raw template untuk filter expiresAt > NOW() di DB level.
 * Lebih aman daripada fetch dulu baru compare di aplikasi.
 */
export async function isSessionValid(refreshToken: string) {
  const [session] = await db
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(
      and(
        eq(sessions.refreshToken, refreshToken),
        sql`${sessions.expiresAt} > NOW()`
      )
    )
    .limit(1);

  return !!session;
}
