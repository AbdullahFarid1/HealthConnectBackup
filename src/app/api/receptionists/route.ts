import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  listReceptionistsByDoctor,
  createReceptionistInvite,
  removeReceptionist,
  updateUserProfile,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * GET    /api/receptionists — list receptionists invited by current doctor
 * POST   /api/receptionists — invite new receptionist { name, email, phone, assignedClinicIds }
 * PUT    /api/receptionists — update receptionist { uid, name?, phone?, assignedClinicIds? }
 * DELETE /api/receptionists — remove receptionist { uid }
 */
export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  const receptionists = await listReceptionistsByDoctor(uid);
  return NextResponse.json(receptionists);
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || !body.email || !body.assignedClinicIds?.length) {
    return NextResponse.json(
      { error: "name, email, and at least one assignedClinicId are required" },
      { status: 400 }
    );
  }

  try {
    const tempPassword = await createReceptionistInvite({
      name: body.name,
      email: body.email,
      phone: body.phone ?? "",
      assignedClinicIds: body.assignedClinicIds,
      doctorId: uid,
    });

    return NextResponse.json({
      status: "invited",
      tempPassword,
      message: "Share these login credentials with the receptionist.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create receptionist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.uid) return NextResponse.json({ error: "Receptionist uid required" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  if (body.name !== undefined) allowed.name = body.name;
  if (body.phone !== undefined) allowed.phone = body.phone;
  if (body.assignedClinicIds !== undefined) allowed.assignedClinicIds = body.assignedClinicIds;

  await updateUserProfile(body.uid, allowed, USER_ROLES.RECEPTION);
  return NextResponse.json({ status: "updated" });
}

export async function DELETE(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.uid) return NextResponse.json({ error: "Receptionist uid required" }, { status: 400 });

  await removeReceptionist(body.uid);
  return NextResponse.json({ status: "removed" });
}
