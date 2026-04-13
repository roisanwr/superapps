// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { deleteSessionByRefreshToken } from "@woilaa/db-auth";

export async function POST(req: Request) {
  try {
    const cookieStore = req.headers.get("cookie") || "";
    const refreshTokenMatch = cookieStore.match(/refresh_token=([^;]+)/);
    const refreshToken = refreshTokenMatch?.[1];

    // Hapus session dari DB jika ada refresh token
    if (refreshToken) {
      await deleteSessionByRefreshToken(refreshToken).catch(() => {
        // Tidak perlu throw — tetap logout walau session sudah expired
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });

    // Clear cookies
    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      domain:
        process.env.NODE_ENV === "production" ? ".roisanwr.me" : undefined,
      path: "/",
      maxAge: 0,
    };

    response.cookies.set("access_token", "", cookieBase);
    response.cookies.set("refresh_token", "", cookieBase);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout." },
      { status: 500 }
    );
  }
}
