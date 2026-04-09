/**
 * Cancel / reschedule policy for HealthConnect appointments.
 *
 * Doctor:
 *   - May cancel/reschedule only if appointment start is ≥ 1 hour away.
 *
 * Patient:
 *   - Default: may cancel/reschedule if appointment start is ≥ 24 hours away.
 *   - Same-day exception: if the booking was made today AND the appointment is
 *     today, the patient may cancel/reschedule only within 1 hour of booking
 *     AND at least 1 hour before the appointment start time.
 *
 * All times are evaluated against the server-provided "now". The
 * appointment time string format is "HH:MM AM/PM" (e.g. "09:30 AM").
 */

const APP_TIMEZONE = "Asia/Karachi";

/** Parse "09:30 AM" → minutes from 00:00. */
export function parseSlotMinutes(slot: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** Default slot length when appointment doc is missing slotDuration (legacy). */
export const DEFAULT_SLOT_DURATION_MINUTES = 30;

/** Build a Date for the slot end (start + slotDuration) in the app timezone. */
export function appointmentEnd(
  date: string,
  timeSlot: string,
  slotDurationMinutes: number = DEFAULT_SLOT_DURATION_MINUTES
): Date {
  const start = appointmentStart(date, timeSlot);
  return new Date(start.getTime() + slotDurationMinutes * 60 * 1000);
}

/** Build a Date for the appointment start in the app timezone. */
export function appointmentStart(date: string, timeSlot: string): Date {
  // We construct an ISO string assuming Asia/Karachi (UTC+5, no DST).
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date : "1970-01-01";
  const minutes = parseSlotMinutes(timeSlot ?? "");
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  // Asia/Karachi is UTC+05:00 year-round.
  const d = new Date(`${safeDate}T${hh}:${mm}:00+05:00`);
  return isValidDate(d) ? d : new Date(0);
}

export function todayInAppTz(now: Date = new Date()): string {
  // Guard against Invalid Date — Intl.DateTimeFormat.formatToParts throws on it.
  const safe = isValidDate(now) ? now : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(safe);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function canDoctorModify(
  appointmentDate: string,
  appointmentTimeSlot: string,
  now: Date = new Date()
): PolicyResult {
  const start = appointmentStart(appointmentDate, appointmentTimeSlot);
  if (start.getTime() - now.getTime() < HOUR) {
    return {
      allowed: false,
      reason: "Doctors can only cancel or reschedule at least 1 hour before the appointment.",
    };
  }
  return { allowed: true };
}

export function canPatientModify(
  appointmentDate: string,
  appointmentTimeSlot: string,
  bookedAtISO: string,
  now: Date = new Date()
): PolicyResult {
  const start = appointmentStart(appointmentDate, appointmentTimeSlot);
  // Legacy appointments may not have a usable createdAt — fall back to "now"
  // so the same-day exception check can't crash on Invalid Date.
  const parsedBookedAt = bookedAtISO ? new Date(bookedAtISO) : new Date(NaN);
  const bookedAt = isValidDate(parsedBookedAt) ? parsedBookedAt : now;
  const today = todayInAppTz(now);
  const bookedToday = todayInAppTz(bookedAt) === today;
  const sameDayAppt = appointmentDate === today;

  // Same-day exception
  if (bookedToday && sameDayAppt) {
    const within1HourOfBooking = now.getTime() - bookedAt.getTime() <= HOUR;
    const atLeast1HourBefore = start.getTime() - now.getTime() >= HOUR;
    if (!within1HourOfBooking) {
      return {
        allowed: false,
        reason:
          "Same-day bookings can only be cancelled or rescheduled within 1 hour of booking.",
      };
    }
    if (!atLeast1HourBefore) {
      return {
        allowed: false,
        reason:
          "You must cancel or reschedule at least 1 hour before the appointment time.",
      };
    }
    return { allowed: true };
  }

  // Default rule: ≥ 1 day before
  if (start.getTime() - now.getTime() < DAY) {
    return {
      allowed: false,
      reason:
        "Patients can only cancel or reschedule at least 1 day before the appointment.",
    };
  }
  return { allowed: true };
}

/** Doctor-side reschedule window: 8:00 AM → 11:00 PM, 30-minute slots. */
export const DOCTOR_RESCHEDULE_START_HOUR = 8;
export const DOCTOR_RESCHEDULE_END_HOUR = 23;

/** Generate every 30-min slot label between 8:00 AM and 11:00 PM. */
export function generateDoctorRescheduleSlots(): string[] {
  const out: string[] = [];
  for (let m = DOCTOR_RESCHEDULE_START_HOUR * 60; m + 30 <= DOCTOR_RESCHEDULE_END_HOUR * 60; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    out.push(`${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`);
  }
  return out;
}

/** Validate that a slot label sits inside the doctor reschedule window. */
export function isWithinDoctorWindow(slot: string): boolean {
  const mins = parseSlotMinutes(slot);
  return mins >= DOCTOR_RESCHEDULE_START_HOUR * 60 && mins + 30 <= DOCTOR_RESCHEDULE_END_HOUR * 60;
}

/** Human-readable policy summary shown to patients during booking. */
export const PATIENT_POLICY_SUMMARY = [
  "You can cancel or reschedule up to 1 day before your appointment.",
  "Same-day bookings: you have a 1-hour window after booking, and only if the appointment is still ≥ 1 hour away.",
  "Refunds = full amount minus the 2% platform fee, processed within 24 hours.",
];
