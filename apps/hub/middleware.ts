// middleware.ts — Custom JWT Auth untuk Hub
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati path publik (termasuk landing "/" dan halaman auth)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  // Tidak ada token — redirect ke login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify JWT
    const payload = await verifyAccessToken(token);

    // Inject userId ke header untuk dipakai di Server Components / API Routes
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.sub);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-user-role", payload.role);

    return response;
  } catch {
    // Token expired — coba refresh
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const response = NextResponse.redirect(refreshUrl);
    response.cookies.set("post_refresh_redirect", pathname, {
      httpOnly: true,
      maxAge: 60,
      path: "/",
    });
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
