import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for route protection.
 *
 * - /o/* (dashboards) require an active session cookie.
 *   If no cookie, redirect to /login.
 *
 * Note: Full role verification happens server-side in the API routes and
 * in the /app portal page (which reads Firebase custom claims).
 * The middleware only does a lightweight "is logged in?" gate.
 */
export function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // Protected routes: dashboards
  if (pathname.startsWith("/o/") || pathname === "/o") {
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected routes: app portal
  if (pathname.startsWith("/app")) {
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/o/:path*", "/app/:path*"],
};
