import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getReceptionistProfile,
  updateUserProfile,
  activateReceptionist,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * POST /api/auth/reset-password
 *
 * Marks the current receptionist's forced password reset as complete. The
 * client must have already called `updatePassword()` on the Firebase Auth
 * side before hitting this endpoint.
 *
 * Effect:
 *   - mustResetPassword → false
 *   - every `accepted` invite transitions to `active`
 */
export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getReceptionistProfile(uid);
  if (!profile) {
    return NextResponse.json({ error: "Not a receptionist" }, { status: 403 });
  }

  await updateUserProfile(uid, { mustResetPassword: false }, USER_ROLES.RECEPTION);
  await activateReceptionist(uid);

  return NextResponse.json({ status: "reset-complete" });
}
