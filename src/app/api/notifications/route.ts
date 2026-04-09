import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  listNotificationsByUser,
  markNotificationsRead,
} from "@/lib/firebase/firestore";

/**
 * GET    /api/notifications        — list current user's notifications
 * PATCH  /api/notifications        — mark notifications read
 *   Body: { ids?: string[] }       (omit to mark all read)
 */
export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const items = await listNotificationsByUser(uid);
  return NextResponse.json(items);
}

export async function PATCH(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;
  await markNotificationsRead(uid, ids);
  return NextResponse.json({ status: "ok" });
}
