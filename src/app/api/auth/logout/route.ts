import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;

  // Revoke Firebase refresh tokens so the session truly ends — clearing the
  // cookie alone leaves refresh tokens valid and the user remains signed in
  // from the Firebase Auth perspective.
  if (sessionCookie) {
    try {
      const decoded = await admin.auth().verifySessionCookie(sessionCookie);
      await admin.auth().revokeRefreshTokens(decoded.sub);
    } catch {
      // Cookie was invalid/expired — nothing to revoke.
    }
  }

  const res = NextResponse.json({ status: "logged out" });
  res.cookies.set("session", "", { maxAge: 0, path: "/" });
  return res;
}
