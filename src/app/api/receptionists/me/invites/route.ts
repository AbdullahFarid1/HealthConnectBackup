import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getReceptionistProfile,
  setReceptionistInviteStatus,
  getUserProfile,
  addNotification,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * GET  /api/receptionists/me/invites
 *   List all invites for the current receptionist with the inviting doctor's
 *   name/specialty resolved for display.
 *
 * POST /api/receptionists/me/invites
 *   body: { doctorId, action: "accept"|"reject" }
 *   Accept or reject a specific doctor's invite.
 */
export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getReceptionistProfile(uid);
  if (!profile) return NextResponse.json({ error: "Not a receptionist" }, { status: 403 });

  const statuses = profile.doctorInviteStatuses ?? {};
  const doctorIds = Object.keys(statuses);

  const invites = await Promise.all(
    doctorIds.map(async (doctorId) => {
      const doc = await getUserProfile(doctorId, USER_ROLES.DOCTOR);
      return {
        doctorId,
        doctorName: doc?.name ?? "Unknown doctor",
        specialty: doc?.specialty ?? "",
        state: statuses[doctorId],
        permissions: profile.doctorPermissions?.[doctorId],
      };
    })
  );

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getReceptionistProfile(uid);
  if (!profile) return NextResponse.json({ error: "Not a receptionist" }, { status: 403 });

  const body = await req.json();
  const doctorId = typeof body.doctorId === "string" ? body.doctorId : "";
  const action: "accept" | "reject" = body.action === "reject" ? "reject" : "accept";
  if (!doctorId) {
    return NextResponse.json({ error: "doctorId required" }, { status: 400 });
  }

  try {
    await setReceptionistInviteStatus(
      uid,
      doctorId,
      action === "accept" ? "accepted" : "rejected"
    );

    // Notify the doctor.
    await addNotification({
      userId: doctorId,
      type: action === "accept" ? "invite-accepted" : "invite-rejected",
      title: action === "accept" ? "Receptionist accepted" : "Receptionist declined",
      message:
        action === "accept"
          ? `${profile.name} accepted your invite.`
          : `${profile.name} declined your invite.`,
    });

    return NextResponse.json({ status: action === "accept" ? "accepted" : "rejected" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update invite";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
