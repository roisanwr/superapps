// app/api/auth/refresh/route.ts — Hub Token Refresh
import { NextResponse } from "next/server";
import {
  getSessionByToken,
  getUserById,
  getAllAppAccessByUserId,
  deleteSessionByToken,
  createSession,
} from "@woilaa/db-auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshTokenMatch = cookieHeader.match(/refresh_token=([^;]+)/);
    const refreshToken = refreshTokenMatch?.[1];

    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Verify refresh token signature
    const payload = await verifyRefreshToken(refreshToken).catch(() => null);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Cek refresh token di DB
    const session = await getSessionByToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Ambil data user terbaru
    const user = await getUserById(session.userId);
    if (!user || !user.isActive) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Ambil app access terbaru
    const appAccess = await getAllAppAccessByUserId(user.id);
    const grantedApps = appAccess
      .filter((a) => a.isGranted)
      .map((a) => a.appName) as ("mykanz" | "bitmove")[];

    // Rotate refresh token
    await deleteSessionByToken(refreshToken);
    const newRefreshToken = await signRefreshToken(user.id);
    const newAccessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      apps: grantedApps,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      domain: isProduction ? ".roisanwr.me" : undefined,
      path: "/",
    };

    // Redirect ke cookie post_refresh_redirect atau dashboard
    const cookieStr = req.headers.get("cookie") || "";
    const redirectMatch = cookieStr.match(/post_refresh_redirect=([^;]+)/);
    const redirectPath = redirectMatch ? decodeURIComponent(redirectMatch[1]) : "/dashboard";
    const response = NextResponse.redirect(new URL(redirectPath, req.url));

    response.cookies.set("access_token", newAccessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear redirect cookie
    response.cookies.set("post_refresh_redirect", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
