import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase/admin";
import { createUserProfile } from "@/lib/firebase/firestore";
import type { UserRole, UserProfileDoc } from "@/types";
import { USER_ROLES } from "@/types";

/**
 * POST /api/users
 * Called right after registration to persist the user profile in Firestore
 * and set Firebase custom claims (role).
 *
 * Body: { name, role, phone?, email?, city?, specialty?, pmdcRegistrationNo? }
 * Requires a valid session cookie (set during the auth flow).
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate via session cookie
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await admin.auth().verifySessionCookie(session, true);
    const uid = decoded.uid;

    const body = await req.json();

    // Normalize role: accept "doctor" or legacy "dentist" -> "doctor"
    let role: UserRole = body.role;
    if (role === "dentist" as string) role = USER_ROLES.DOCTOR;

    const validRoles: UserRole[] = [USER_ROLES.PATIENT, USER_ROLES.DOCTOR, USER_ROLES.RECEPTION, USER_ROLES.ADMIN];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const profile: UserProfileDoc = {
      uid,
      name: body.name ?? decoded.name ?? "",
      email: decoded.email ?? body.email ?? "",
      phone: decoded.phone_number ?? body.phone ?? "",
      role,
      ...(body.city ? { city: body.city } : {}),
      ...(body.specialty ? { specialty: body.specialty } : {}),
      ...(body.pmdcRegistrationNo
        ? { pmdcRegistrationNo: body.pmdcRegistrationNo }
        : {}),
      ...(body.consultationFee
        ? { consultationFee: Number(body.consultationFee) }
        : {}),
      createdAt: now,
      updatedAt: now,
    };

    await createUserProfile(profile);

    return NextResponse.json({ status: "created", uid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    // If profile already exists, return 409 Conflict instead of 500
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message, code: "PROFILE_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
