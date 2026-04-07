import { NextRequest, NextResponse } from "next/server";
import { getUidFromSession, getUserProfile, updateUserProfile } from "@/lib/firebase/firestore";

/**
 * GET /api/users/me — return the current user's profile
 * PUT /api/users/me — update the current user's profile
 */
export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();

  // Only allow updating safe fields
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "city", "specialty", "consultationFee", "bio", "phone", "photoUrl"]) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }
  if (body.consultationFee !== undefined) {
    allowed.consultationFee = Number(body.consultationFee);
  }

  await updateUserProfile(uid, allowed);
  return NextResponse.json({ status: "updated" });
}
