import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  setAvailability,
  deleteAvailability,
  listAvailabilityByClinic,
  listAvailabilityByDoctor,
  listAppointmentsByDoctorForDate,
  generateSlots,
  todayInAppTz,
  isValidDateString,
  findOverlappingAvailability,
  dayOfWeekForDate,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";
import type { SlotDuration } from "@/types";

/**
 * GET  /api/availability?clinicId=X — list availability for a clinic
 * GET  /api/availability?doctorId=X&date=YYYY-MM-DD — get available slots for booking
 * POST /api/availability — set availability { clinicId, daysOfWeek, startTime, endTime, slotDuration }
 *      daysOfWeek can be a single number or an array of numbers (0-6)
 * DELETE /api/availability — delete availability { id }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const clinicId = searchParams.get("clinicId");
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  // Public endpoint: get available slots for a specific doctor + date
  if (doctorId && date) {
    if (!isValidDateString(date)) {
      return NextResponse.json({ slots: [] });
    }
    // Reject past dates using app-timezone "today" (Asia/Karachi).
    const today = todayInAppTz();
    if (date < today) {
      return NextResponse.json({ slots: [] });
    }

    const availability = await listAvailabilityByDoctor(doctorId);
    const allSlots = generateSlots(availability, date);

    // Remove already-booked slots (cancelled bookings free their slot)
    const booked = await listAppointmentsByDoctorForDate(doctorId, date);
    const bookedSlots = new Set(
      booked.filter((a) => a.status !== "cancelled").map((a) => a.timeSlot)
    );
    let availableSlots = allSlots.filter((s) => !bookedSlots.has(s));

    // If today, also filter out slots that have already passed (in app TZ).
    if (date === today) {
      const nowParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Karachi",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date());
      const hh = Number(nowParts.find((p) => p.type === "hour")?.value ?? "0");
      const mm = Number(nowParts.find((p) => p.type === "minute")?.value ?? "0");
      const nowMinutes = hh * 60 + mm;
      availableSlots = availableSlots.filter((slot) => {
        const [time, period] = slot.split(" ");
        const [h, m] = time.split(":").map(Number);
        let hours24 = h;
        if (period === "PM" && h !== 12) hours24 = h + 12;
        if (period === "AM" && h === 12) hours24 = 0;
        return hours24 * 60 + m > nowMinutes;
      });
    }

    return NextResponse.json({ slots: availableSlots });
  }

  // Doctor-only: list availability config for a clinic
  if (clinicId) {
    const items = await listAvailabilityByClinic(clinicId);
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: "clinicId or (doctorId + date) required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid, USER_ROLES.DOCTOR);
  if (!profile || profile.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
  }

  const body = await req.json();

  // Two modes:
  //  - One-off (default, repeatWeekly=false): body.specificDate (YYYY-MM-DD).
  //  - Recurring (repeatWeekly=true): body.daysOfWeek (or legacy dayOfWeek).
  const repeatWeekly: boolean = body.repeatWeekly === true;

  let daysOfWeek: number[] = [];
  let specificDate: string | undefined;

  if (repeatWeekly) {
    daysOfWeek = Array.isArray(body.daysOfWeek)
      ? body.daysOfWeek
      : body.dayOfWeek !== undefined
        ? [body.dayOfWeek]
        : [];
    if (daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: "Recurring availability requires at least one day of week." },
        { status: 400 }
      );
    }
  } else {
    specificDate = body.specificDate;
    if (!specificDate || !isValidDateString(specificDate)) {
      return NextResponse.json(
        { error: "One-off availability requires a valid specificDate (YYYY-MM-DD)." },
        { status: 400 }
      );
    }
    if (specificDate < todayInAppTz()) {
      return NextResponse.json(
        { error: "specificDate cannot be in the past." },
        { status: 400 }
      );
    }
    daysOfWeek = [dayOfWeekForDate(specificDate)];
  }

  if (!body.clinicId || !body.startTime || !body.endTime || !body.slotDuration) {
    return NextResponse.json(
      { error: "clinicId, startTime, endTime, and slotDuration are required" },
      { status: 400 }
    );
  }

  const validDurations: SlotDuration[] = [15, 30, 45, 60];
  if (!validDurations.includes(body.slotDuration)) {
    return NextResponse.json({ error: "slotDuration must be 15, 30, 45, or 60" }, { status: 400 });
  }

  // Validate time format and that start < end. This blocks invalid ranges
  // like 19:00–04:00 that previously produced empty / wrap-around slot lists.
  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRe.test(body.startTime) || !timeRe.test(body.endTime)) {
    return NextResponse.json({ error: "startTime and endTime must be HH:mm" }, { status: 400 });
  }
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMin = toMin(body.startTime);
  const endMin = toMin(body.endTime);
  if (endMin <= startMin) {
    return NextResponse.json(
      { error: "End time must be later than start time." },
      { status: 400 }
    );
  }
  if (endMin - startMin < body.slotDuration) {
    return NextResponse.json(
      { error: "Time range is shorter than the chosen slot duration." },
      { status: 400 }
    );
  }

  // Validate all days are 0-6
  for (const day of daysOfWeek) {
    if (day < 0 || day > 6) {
      return NextResponse.json({ error: "dayOfWeek must be between 0 (Sun) and 6 (Sat)" }, { status: 400 });
    }
  }

  // Reject overlap with any existing block on the same day for the same clinic.
  // Multiple non-overlapping blocks per day are allowed (e.g. 3-5pm and 7-10pm).
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const day of daysOfWeek) {
    const overlap = await findOverlappingAvailability(
      uid,
      body.clinicId,
      day,
      body.startTime,
      body.endTime,
      specificDate
    );
    if (overlap) {
      return NextResponse.json(
        {
          error: `${DAY_NAMES[day]}: this time range overlaps an existing block (${overlap.startTime}–${overlap.endTime}).`,
        },
        { status: 409 }
      );
    }
  }

  const now = new Date().toISOString();
  const ids: string[] = [];

  for (const day of daysOfWeek) {
    const id = await setAvailability({
      doctorId: uid,
      clinicId: body.clinicId,
      dayOfWeek: day,
      repeatWeekly,
      specificDate: repeatWeekly ? undefined : specificDate,
      startTime: body.startTime,
      endTime: body.endTime,
      slotDuration: body.slotDuration,
      createdAt: now,
      updatedAt: now,
    });
    ids.push(id);
  }

  return NextResponse.json({ status: "saved", ids });
}

export async function DELETE(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await deleteAvailability(body.id);
  return NextResponse.json({ status: "deleted" });
}
