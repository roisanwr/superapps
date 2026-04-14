// lib/session.ts
// Helper untuk ambil user dari JWT cookie di Server Components & API Routes

import { cookies } from "next/headers";
import { verifyAccessToken, type AppJWTPayload } from "./jwt";

/**
 * Ambil current user dari access_token cookie.
 * Gunakan ini di Server Components atau API Routes.
 * Return null jika token tidak ada atau expired.
 */
export async function getCurrentUser(): Promise<AppJWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return null;

    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Ambil userId dari cookie — shortcut untuk API Routes.
 * Throw error jika tidak ada user (untuk protected routes).
 */
export async function requireUser(): Promise<AppJWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  // Pastikan user punya akses ke bitmove
  if (!user.apps?.includes("bitmove")) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
