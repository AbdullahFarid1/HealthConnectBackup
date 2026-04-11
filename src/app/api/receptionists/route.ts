import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  listReceptionistsByDoctor,
  createReceptionistInvite,
  linkExistingReceptionist,
  unlinkReceptionistFromDoctor,
  updateReceptionistPermissions,
  updateReceptionistClinics,
  findUserByEmail,
  ensureReceptionistMigration,
  addNotification,
} from "@/lib/firebase/firestore";
import { USER_ROLES, type ReceptionistPermissions } from "@/types";

/**
 * GET    /api/receptionists                 — list receptionists linked to current doctor
 * GET    /api/receptionists?email=…         — lookup (for link-existing UI)
 * POST   /api/receptionists                 — create new OR link existing
 *          body: { mode: "create"|"link", name?, email, phone?, clinicIds, permissions? }
 * PUT    /api/receptionists                 — update permissions or clinic assignment
 *          body: { uid, permissions?, clinicIds? }
 * DELETE /api/receptionists                 — unlink (preserves account)
 *          body: { uid }
 */
async function requireDoctor(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return { error: NextResponse.json({ error: "Not a doctor" }, { status: 403 }) };
  }
  return { uid, profile };
}

export async function GET(req: NextRequest) {
  await ensureReceptionistMigration();
  const auth = await requireDoctor(req);
  if ("error" in auth) return auth.error;

  const email = req.nextUrl.searchParams.get("email");
  if (email) {
    const found = await findUserByEmail(email);
    if (!found) {
      return NextResponse.json({ exists: false });
    }
    if (found.role !== USER_ROLES.RECEPTION) {
      return NextResponse.json({
        exists: true,
        canLink: false,
        role: found.role,
        reason: `This email belongs to a ${found.role} account. Users cannot hold multiple roles.`,
      });
    }
    // Already linked to this doctor?
    const alreadyLinked = (found.profile.invitedByDoctorIds ?? []).includes(auth.uid);
    return NextResponse.json({
      exists: true,
      canLink: true,
      role: found.role,
      alreadyLinked,
      profile: {
        uid: found.profile.uid,
        name: found.profile.name,
        email: found.profile.email,
        phone: found.profile.phone,
      },
    });
  }

  const receptionists = await listReceptionistsByDoctor(auth.uid);
  // Strip maps to only the current doctor's entries so the client never sees
  // other doctors' permissions or invite state for this receptionist.
  const scoped = receptionists.map((r) => {
    const inviteState = r.doctorInviteStatuses?.[auth.uid];
    const perms = r.doctorPermissions?.[auth.uid];
    return {
      ...r,
      doctorInviteStatuses: inviteState ? { [auth.uid]: inviteState } : {},
      doctorPermissions: perms ? { [auth.uid]: perms } : {},
    };
  });
  return NextResponse.json({ doctorId: auth.uid, receptionists: scoped });
}

export async function POST(req: NextRequest) {
  await ensureReceptionistMigration();
  const auth = await requireDoctor(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const mode: "create" | "link" = body.mode === "link" ? "link" : "create";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const clinicIds: string[] = Array.isArray(body.clinicIds) ? body.clinicIds : [];
  const permissions: ReceptionistPermissions | undefined = body.permissions;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (clinicIds.length === 0) {
    return NextResponse.json(
      { error: "Please assign at least one clinic." },
      { status: 400 }
    );
  }

  try {
    if (mode === "create") {
      if (!body.name) {
        return NextResponse.json({ error: "Name is required." }, { status: 400 });
      }
      const result = await createReceptionistInvite({
        name: body.name,
        email,
        phone: body.phone ?? "",
        clinicIds,
        doctorId: auth.uid,
        permissions,
      });
      await addNotification({
        userId: result.uid,
        type: "invite-received",
        title: "New doctor invite",
        message: `${auth.profile.name ?? "A doctor"} has invited you to join their practice.`,
      });
      return NextResponse.json({
        status: "created",
        uid: result.uid,
        tempPassword: result.tempPassword,
        email,
        message: "Share these login credentials with the receptionist.",
      });
    }

    // Link existing
    const profile = await linkExistingReceptionist({
      email,
      clinicIds,
      doctorId: auth.uid,
      permissions,
    });
    await addNotification({
      userId: profile.uid,
      type: "invite-received",
      title: "New doctor invite",
      message: `${auth.profile.name ?? "A doctor"} has invited you to join their practice.`,
    });
    return NextResponse.json({ status: "linked", uid: profile.uid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add receptionist";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireDoctor(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  if (!body.uid) {
    return NextResponse.json({ error: "Receptionist uid required" }, { status: 400 });
  }

  // Verify the receptionist is actually linked to this doctor before mutating.
  const linked = await listReceptionistsByDoctor(auth.uid);
  if (!linked.find((r) => r.uid === body.uid)) {
    return NextResponse.json(
      { error: "This receptionist is not linked to you." },
      { status: 403 }
    );
  }

  if (body.permissions) {
    await updateReceptionistPermissions(body.uid, auth.uid, body.permissions);
  }
  if (Array.isArray(body.clinicIds)) {
    await updateReceptionistClinics(body.uid, auth.uid, body.clinicIds);
  }

  return NextResponse.json({ status: "updated" });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireDoctor(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  if (!body.uid) {
    return NextResponse.json({ error: "Receptionist uid required" }, { status: 400 });
  }

  await unlinkReceptionistFromDoctor(body.uid, auth.uid);
  return NextResponse.json({ status: "unlinked" });
}
