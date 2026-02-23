import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // This must match the cookie name set in `/api/auth/session`
  const sessionCookie = request.cookies.get("session");

  // Protect authenticated app routes
  if (!sessionCookie && request.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
