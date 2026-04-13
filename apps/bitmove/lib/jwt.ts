// lib/jwt.ts
// Helper untuk sign & verify JWT menggunakan jose (edge-compatible)
// JWT_SECRET harus SAMA di semua app agar SSO bisa bekerja!

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AppJWTPayload extends JWTPayload {
  sub: string;        // user.id (UUID)
  email: string;
  username: string;
  name: string;
  role: "user" | "admin";
  apps: ("mykanz" | "bitmove")[];
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not set");
  return new TextEncoder().encode(secret);
};

// Sign access token — 15 menit
export async function signAccessToken(payload: Omit<AppJWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

// Sign refresh token — 7 hari
export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<AppJWTPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as AppJWTPayload;
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as { sub: string };
}
