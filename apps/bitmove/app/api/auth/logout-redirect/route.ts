// app/api/auth/logout-redirect/route.ts
// Dipanggil oleh server action logOutAction() karena server actions tidak bisa
// hapus httpOnly cookies secara langsung. Route ini menghapus cookies lewat header.

import { NextResponse } from "next/server";
import { deleteSessionByToken } from "@woilaa/db-auth";

export async function GET(req: Request) {
  const cookieStore = req.headers.get("cookie") || "";
  const refreshTokenMatch = cookieStore.match(/refresh_token=([^;]+)/);
  const refreshToken = refreshTokenMatch?.[1];

  // Hapus session dari DB jika ada refresh token
  if (refreshToken) {
    await deleteSessionByToken(refreshToken).catch(() => {
      // Tidak perlu throw — tetap logout walau session sudah expired
    });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    domain: isProduction ? ".roisanwr.me" : undefined,
    path: "/",
    maxAge: 0,
  };

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.set("access_token", "", cookieBase);
  response.cookies.set("refresh_token", "", cookieBase);

  return response;
}
