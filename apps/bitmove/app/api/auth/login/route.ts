// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getUserByIdentifier,
  getAllAppAccessByUserId,
  createSession,
} from "@woilaa/db-auth";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email dan password wajib diisi!" },
        { status: 400 }
      );
    }

    // 1. Cari user by identifier (email atau username)
    const user = await getUserByIdentifier(identifier);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Username/email atau password salah!" },
        { status: 401 }
      );
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username/email atau password salah!" },
        { status: 401 }
      );
    }

    // 3. Cek akses app
    const appAccess = await getAllAppAccessByUserId(user.id);
    const grantedApps = appAccess
      .filter((a) => a.isGranted)
      .map((a) => a.appName) as ("mykanz" | "bitmove")[];

    // 4. Sign tokens
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      apps: grantedApps,
    });

    const refreshToken = await signRefreshToken(user.id);

    // 5. Simpan refresh token ke DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    await createSession({
      userId: user.id,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // 6. Set cookies
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      domain: isProduction ? ".roisanwr.me" : undefined,
      path: "/",
    };

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set("access_token", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15, // 15 menit
    });

    response.cookies.set("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
