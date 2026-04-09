import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  createClinic,
  listClinicsByDoctor,
  updateClinic,
  deleteClinic,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * GET  /api/clinics — list current doctor's clinics
 * POST /api/clinics — add a clinic { name, address, city, phone }
 * PUT  /api/clinics — update a clinic { id, ...fields }
 * DELETE /api/clinics — delete a clinic { id }
 */
export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  const clinics = await listClinicsByDoctor(uid);
  return NextResponse.json(clinics);
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || !body.address || !body.city) {
    return NextResponse.json({ error: "name, address, and city are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = await createClinic({
    doctorId: uid,
    name: body.name,
    address: body.address,
    city: body.city,
    phone: body.phone ?? "",
    mapUrl: body.mapUrl || undefined,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ status: "created", id });
}

export async function PUT(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Clinic id required" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "address", "city", "phone", "mapUrl"]) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  await updateClinic(body.id, allowed);
  return NextResponse.json({ status: "updated" });
}

export async function DELETE(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Clinic id required" }, { status: 400 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  // Check at least 1 clinic remains
  const clinics = await listClinicsByDoctor(uid);
  if (clinics.length <= 1) {
    return NextResponse.json({ error: "You must have at least one clinic" }, { status: 400 });
  }

  await deleteClinic(body.id);
  return NextResponse.json({ status: "deleted" });
}
