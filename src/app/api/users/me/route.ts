import { NextRequest, NextResponse } from "next/server";
import { getUidFromSession, getUserProfile, updateUserProfile } from "@/lib/firebase/firestore";
import { isValidCnic, normalizeCnic } from "@/lib/utils";

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
  for (const key of ["name", "city", "specialty", "consultationFee", "bio", "phone", "photoUrl", "cnic", "email"]) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }
  if (body.email !== undefined) {
    const email = String(body.email).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    allowed.email = email;
  }
  if (body.consultationFee !== undefined) {
    allowed.consultationFee = Number(body.consultationFee);
  }

  // ─── Patient profile fields ────────────────────────────
  if (body.dob !== undefined) {
    if (body.dob === "" || body.dob === null) {
      allowed.dob = "";
    } else if (typeof body.dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dob)) {
      return NextResponse.json(
        { error: "dob must be a valid date in YYYY-MM-DD format." },
        { status: 400 }
      );
    } else {
      const d = new Date(`${body.dob}T00:00:00`);
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now()) {
        return NextResponse.json(
          { error: "dob must be a real date that is not in the future." },
          { status: 400 }
        );
      }
      allowed.dob = body.dob;
    }
  }
  if (body.age !== undefined) {
    if (body.age === "" || body.age === null) {
      allowed.age = null;
    } else {
      const ageNum = Number(body.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
        return NextResponse.json(
          { error: "age must be an integer between 0 and 120." },
          { status: 400 }
        );
      }
      allowed.age = ageNum;
    }
  }
  if (body.gender !== undefined) {
    const allowedGenders = ["male", "female", "other", ""] as const;
    if (!allowedGenders.includes(body.gender)) {
      return NextResponse.json(
        { error: "gender must be one of: male, female, other." },
        { status: 400 }
      );
    }
    allowed.gender = body.gender === "" ? null : body.gender;
  }

  // CNIC is mandatory for doctors — validate whenever it is being set.
  // The doctor profile UI enforces the mandatory rule before the user
  // can submit for the first time.
  if (body.cnic !== undefined) {
    if (!isValidCnic(body.cnic)) {
      return NextResponse.json(
        { error: "CNIC must be 13 digits (format: XXXXX-XXXXXXX-X)." },
        { status: 400 }
      );
    }
    allowed.cnic = normalizeCnic(body.cnic);
  }

  await updateUserProfile(uid, allowed);
  return NextResponse.json({ status: "updated" });
}
