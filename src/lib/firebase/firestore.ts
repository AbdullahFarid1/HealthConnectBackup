import "server-only";
import { admin } from "./admin";
import type {
  UserProfileDoc,
  Appointment,
  AppointmentStatus,
  ClinicDoc,
  AvailabilityDoc,
  UserRole,
  NotificationDoc,
  NotificationType,
} from "@/types";
import { USER_ROLES } from "@/types";
import {
  appointmentEnd as _appointmentEnd,
  appointmentStart as _appointmentStart,
  DEFAULT_SLOT_DURATION_MINUTES,
} from "@/lib/policy";

const firestore = admin.firestore();

// ─── Role-based collections ─────────────────────────────
const patientsCol = () => firestore.collection("patients");
const doctorsCol = () => firestore.collection("doctors");
const receptionistsCol = () => firestore.collection("receptionists");
const adminsCol = () => firestore.collection("admins");

/** Get the correct collection for a given role */
function roleCol(role: UserRole) {
  switch (role) {
    case USER_ROLES.PATIENT:
      return patientsCol();
    case USER_ROLES.DOCTOR:
      return doctorsCol();
    case USER_ROLES.RECEPTION:
      return receptionistsCol();
    case USER_ROLES.ADMIN:
      return adminsCol();
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

// Legacy single collection (for migration reads)
const usersCol = () => firestore.collection("users");

const appointmentsCol = () => firestore.collection("appointments");
const clinicsCol = () => firestore.collection("clinics");
const availabilityCol = () => firestore.collection("availability");
const notificationsCol = () => firestore.collection("notifications");

// ─── Date helpers ─────────────────────────────────────────
// HealthConnect operates in Pakistan (Asia/Karachi, UTC+5, no DST). All
// date strings stored/compared in Firestore are local Pakistan dates so
// they remain stable regardless of where the server runs.
const APP_TIMEZONE = "Asia/Karachi";

export function todayInAppTz(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Day-of-week (0=Sun..6=Sat) for a YYYY-MM-DD date string in app timezone. */
export function dayOfWeekForDate(dateStr: string): number {
  // Anchor at noon UTC to avoid DST/offset edge cases when extracting weekday.
  const d = new Date(`${dateStr}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/** Validates that a string is YYYY-MM-DD and refers to a real calendar date. */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// ─── Strip undefined values (Firestore rejects them) ─────
function clean<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

// ─── Auth helper ──────────────────────────────────────────
export async function getUidFromSession(
  sessionCookie: string | undefined
): Promise<string | null> {
  if (!sessionCookie) return null;
  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─── Users ────────────────────────────────────────────────

/**
 * Create user profile in the role-specific collection.
 * Uses UID as document ID to prevent overwrites across roles.
 *
 * CRITICAL: Checks ALL role collections (not just the target one) to prevent
 * a stale registration attempt from overwriting an existing profile in a different role.
 */
export async function createUserProfile(data: UserProfileDoc) {
  // Check ALL collections for this UID — prevents cross-role overwrites
  const allCollections = [patientsCol(), doctorsCol(), receptionistsCol(), adminsCol()];
  for (const col of allCollections) {
    const snap = await col.doc(data.uid).get();
    if (snap.exists) {
      const existingData = snap.data() as UserProfileDoc;
      throw new Error(
        `Profile already exists for this user (role: ${existingData.role}). Cannot create as ${data.role}.`
      );
    }
  }

  // Also check legacy "users" collection
  const legacySnap = await usersCol().doc(data.uid).get();
  if (legacySnap.exists) {
    throw new Error("Profile already exists (legacy). Please sign in instead of registering.");
  }

  const col = roleCol(data.role);
  await col.doc(data.uid).set(clean(data));
  await admin.auth().setCustomUserClaims(data.uid, { role: data.role });
}

/**
 * Get user profile by UID. Searches the role-specific collection first (if role known),
 * otherwise searches all role collections.
 */
export async function getUserProfile(uid: string, knownRole?: UserRole): Promise<UserProfileDoc | null> {
  // If role is known, look directly
  if (knownRole) {
    const snap = await roleCol(knownRole).doc(uid).get();
    if (snap.exists) return snap.data() as UserProfileDoc;
    return null;
  }

  // Search all role collections
  const collections = [patientsCol(), doctorsCol(), receptionistsCol(), adminsCol()];
  for (const col of collections) {
    const snap = await col.doc(uid).get();
    if (snap.exists) return snap.data() as UserProfileDoc;
  }

  // Fallback: check legacy "users" collection for backward compatibility
  const legacySnap = await usersCol().doc(uid).get();
  if (legacySnap.exists) {
    const data = legacySnap.data() as UserProfileDoc;
    // Migrate: normalize "dentist" to "doctor"
    if ((data.role as string) === "dentist") {
      data.role = USER_ROLES.DOCTOR;
    }
    // Migrate to new collection
    await roleCol(data.role).doc(uid).set(clean(data));
    await usersCol().doc(uid).delete();
    await admin.auth().setCustomUserClaims(uid, { role: data.role });
    return data;
  }

  return null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfileDoc>,
  knownRole?: UserRole
) {
  const profile = await getUserProfile(uid, knownRole);
  if (!profile) throw new Error("Profile not found");
  await roleCol(profile.role).doc(uid).update(clean({ ...data, updatedAt: new Date().toISOString() }));
}

// ─── Doctor search ────────────────────────────────────────
export async function searchDoctors(filters: {
  specialty?: string;
  city?: string;
  query?: string;
  limit?: number;
}): Promise<UserProfileDoc[]> {
  let q: FirebaseFirestore.Query = doctorsCol();

  if (filters.specialty) {
    q = q.where("specialty", "==", filters.specialty);
  }
  if (filters.city) {
    q = q.where("city", "==", filters.city);
  }

  q = q.limit(filters.limit ?? 20);
  const snap = await q.get();
  let results = snap.docs.map((d) => d.data() as UserProfileDoc);

  if (filters.query) {
    const lower = filters.query.toLowerCase();
    results = results.filter(
      (doc) =>
        doc.name.toLowerCase().includes(lower) ||
        (doc.specialty ?? "").toLowerCase().includes(lower) ||
        (doc.city ?? "").toLowerCase().includes(lower)
    );
  }
  return results;
}

/** Get a single doctor by uid */
export async function getDoctorById(uid: string): Promise<UserProfileDoc | null> {
  const snap = await doctorsCol().doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as UserProfileDoc;
  if (data.role !== USER_ROLES.DOCTOR) return null;
  return data;
}

// ─── Clinics ──────────────────────────────────────────────
export async function createClinic(data: Omit<ClinicDoc, "id">): Promise<string> {
  const ref = clinicsCol().doc();
  await ref.set(clean({ ...data, id: ref.id }));
  return ref.id;
}

export async function getClinic(id: string): Promise<ClinicDoc | null> {
  const snap = await clinicsCol().doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as ClinicDoc;
}

export async function updateClinic(id: string, data: Partial<ClinicDoc>) {
  await clinicsCol().doc(id).update(clean({ ...data, updatedAt: new Date().toISOString() }));
}

export async function deleteClinic(id: string) {
  await clinicsCol().doc(id).delete();
  // Also delete related availability
  const avSnap = await availabilityCol().where("clinicId", "==", id).get();
  const batch = firestore.batch();
  avSnap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function listClinicsByDoctor(doctorId: string): Promise<ClinicDoc[]> {
  const snap = await clinicsCol()
    .where("doctorId", "==", doctorId)
    .get();
  const docs = snap.docs.map((d) => d.data() as ClinicDoc);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ─── Availability ─────────────────────────────────────────
export async function setAvailability(data: Omit<AvailabilityDoc, "id">): Promise<string> {
  // Always create a new block — doctors may have multiple availability windows
  // on the same day (e.g. 3-5pm and 7-10pm).
  const ref = availabilityCol().doc();
  await ref.set(clean({ ...data, id: ref.id }));
  return ref.id;
}

/** Returns true if the [aStart, aEnd) and [bStart, bEnd) HH:mm ranges overlap. */
function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
}

/**
 * Detect overlap with existing availability blocks for the same doctor+clinic+day.
 * If `specificDate` is supplied (one-off block), only blocks that actually apply
 * on that date are considered (recurring weekly OR one-off matching the date).
 */
export async function findOverlappingAvailability(
  doctorId: string,
  clinicId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  specificDate?: string
): Promise<AvailabilityDoc | null> {
  const snap = await availabilityCol()
    .where("doctorId", "==", doctorId)
    .where("clinicId", "==", clinicId)
    .where("dayOfWeek", "==", dayOfWeek)
    .get();
  for (const d of snap.docs) {
    const block = d.data() as AvailabilityDoc;
    const blockApplies =
      block.repeatWeekly === false
        ? specificDate
          ? block.specificDate === specificDate
          : false // recurring being added skips one-off blocks of other dates
        : true; // recurring block always applies
    if (!blockApplies) continue;
    if (timeRangesOverlap(startTime, endTime, block.startTime, block.endTime)) {
      return block;
    }
  }
  return null;
}

export async function deleteAvailability(id: string) {
  await availabilityCol().doc(id).delete();
}

export async function listAvailabilityByClinic(clinicId: string): Promise<AvailabilityDoc[]> {
  const snap = await availabilityCol()
    .where("clinicId", "==", clinicId)
    .get();
  const docs = snap.docs.map((d) => d.data() as AvailabilityDoc);
  return docs.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export async function listAvailabilityByDoctor(doctorId: string): Promise<AvailabilityDoc[]> {
  const snap = await availabilityCol()
    .where("doctorId", "==", doctorId)
    .get();
  const docs = snap.docs.map((d) => d.data() as AvailabilityDoc);
  return docs.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/** Generate time slots from availability for a specific date */
export function generateSlots(
  availability: AvailabilityDoc[],
  date: string // YYYY-MM-DD
): string[] {
  // Compute day-of-week in the app's timezone (Asia/Karachi) so the result
  // doesn't shift when the server runs in UTC or another zone.
  const dayOfWeek = dayOfWeekForDate(date);
  const blocks = availability.filter((a) => {
    // One-off block: only matches the exact date it was created for.
    if (a.repeatWeekly === false) return a.specificDate === date;
    // Recurring (default for legacy data): matches weekday.
    return a.dayOfWeek === dayOfWeek;
  });

  const slots: string[] = [];
  for (const block of blocks) {
    const [startH, startM] = block.startTime.split(":").map(Number);
    const [endH, endM] = block.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const dur = block.slotDuration;

    for (let m = startMin; m + dur <= endMin; m += dur) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      slots.push(
        `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`
      );
    }
  }
  return slots;
}

// ─── Appointments ─────────────────────────────────────────

/** Sentinel returned by createAppointment when a slot is already booked. */
export class SlotAlreadyBookedError extends Error {
  constructor() {
    super("This time slot is no longer available.");
    this.name = "SlotAlreadyBookedError";
  }
}

/** Make a Firestore-safe slug from a slot label like "09:00 AM". */
function slotKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Atomically reserve a slot using a deterministic doc ID
 * (`{doctorId}_{date}_{slotKey}`) so two concurrent bookings cannot win the
 * same slot — Firestore's `create()` rejects if the doc already exists.
 *
 * Uses a transaction to also reject conflicts with non-cancelled appointments
 * created via legacy random IDs.
 */
export async function createAppointment(
  data: Omit<Appointment, "id">
): Promise<string> {
  const id = `${data.doctorId}_${data.date}_${slotKey(data.timeSlot)}`;
  const ref = appointmentsCol().doc(id);

  await firestore.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      const cur = existing.data() as Appointment;
      if (cur.status !== "cancelled") throw new SlotAlreadyBookedError();
    }

    // Belt-and-braces: also check for any other appointment doc with the
    // same doctor+date+timeSlot that isn't cancelled. Required because
    // pre-existing data may not use the deterministic ID scheme.
    const dupSnap = await tx.get(
      appointmentsCol()
        .where("doctorId", "==", data.doctorId)
        .where("date", "==", data.date)
        .where("timeSlot", "==", data.timeSlot)
    );
    for (const d of dupSnap.docs) {
      if (d.id === id) continue;
      const a = d.data() as Appointment;
      if (a.status !== "cancelled") throw new SlotAlreadyBookedError();
    }

    tx.set(ref, clean({ ...data, id }));
  });

  return id;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await appointmentsCol().doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  await appointmentsCol().doc(id).update({ status, updatedAt: new Date().toISOString() });
}

/** Generic partial update for an appointment doc. */
export async function updateAppointment(
  id: string,
  data: Partial<Appointment>
) {
  await appointmentsCol()
    .doc(id)
    .update(clean({ ...data, updatedAt: new Date().toISOString() }));
}

/**
 * Atomically reschedule an appointment to a new (date, timeSlot) by creating
 * a new deterministic-ID doc and deleting the old one. Throws
 * SlotAlreadyBookedError if the new slot is taken.
 */
export async function rescheduleAppointment(
  oldId: string,
  newDate: string,
  newTimeSlot: string,
  extra: Partial<Appointment>
): Promise<string> {
  const oldRef = appointmentsCol().doc(oldId);
  const oldSnap = await oldRef.get();
  if (!oldSnap.exists) throw new Error("Appointment not found");
  const old = oldSnap.data() as Appointment;

  const newId = `${old.doctorId}_${newDate}_${slotKey(newTimeSlot)}`;
  if (newId === oldId) {
    // Same slot — nothing to do but apply extras.
    await oldRef.update(clean({ ...extra, updatedAt: new Date().toISOString() }));
    return oldId;
  }
  const newRef = appointmentsCol().doc(newId);

  await firestore.runTransaction(async (tx) => {
    const existing = await tx.get(newRef);
    if (existing.exists) {
      const cur = existing.data() as Appointment;
      if (cur.status !== "cancelled") throw new SlotAlreadyBookedError();
    }
    // Conflicts via legacy random IDs
    const dupSnap = await tx.get(
      appointmentsCol()
        .where("doctorId", "==", old.doctorId)
        .where("date", "==", newDate)
        .where("timeSlot", "==", newTimeSlot)
    );
    for (const d of dupSnap.docs) {
      if (d.id === newId || d.id === oldId) continue;
      const a = d.data() as Appointment;
      if (a.status !== "cancelled") throw new SlotAlreadyBookedError();
    }

    const merged: Appointment = {
      ...old,
      ...extra,
      id: newId,
      date: newDate,
      timeSlot: newTimeSlot,
      updatedAt: new Date().toISOString(),
    };
    tx.set(newRef, clean(merged));
    tx.delete(oldRef);
  });

  return newId;
}

export async function listAppointmentsByPatient(
  patientId: string
): Promise<Appointment[]> {
  const snap = await appointmentsCol()
    .where("patientId", "==", patientId)
    .limit(50)
    .get();
  const docs = snap.docs.map((d) => d.data() as Appointment);
  return docs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function listAppointmentsByDoctor(
  doctorId: string
): Promise<Appointment[]> {
  const snap = await appointmentsCol()
    .where("doctorId", "==", doctorId)
    .limit(50)
    .get();
  const docs = snap.docs.map((d) => d.data() as Appointment);
  return docs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function listAppointmentsByDoctorForDate(
  doctorId: string,
  date: string
): Promise<Appointment[]> {
  const snap = await appointmentsCol()
    .where("doctorId", "==", doctorId)
    .where("date", "==", date)
    .get();
  return snap.docs.map((d) => d.data() as Appointment);
}

// ─── Receptionists (managed by doctor) ────────────────────
export async function listReceptionistsByDoctor(
  doctorId: string
): Promise<UserProfileDoc[]> {
  const snap = await receptionistsCol()
    .where("role", "==", USER_ROLES.RECEPTION)
    .where("invitedByDoctorId", "==", doctorId)
    .get();
  return snap.docs.map((d) => d.data() as UserProfileDoc);
}

export async function createReceptionistInvite(data: {
  name: string;
  email: string;
  phone: string;
  assignedClinicIds: string[];
  doctorId: string;
}): Promise<string> {
  // Create Firebase Auth user with a generated password
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const userRecord = await admin.auth().createUser({
    email: data.email,
    password: tempPassword,
    displayName: data.name,
    phoneNumber: data.phone.startsWith("+") ? data.phone : undefined,
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, { role: USER_ROLES.RECEPTION });

  const now = new Date().toISOString();
  const profile: UserProfileDoc = {
    uid: userRecord.uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: USER_ROLES.RECEPTION,
    assignedClinicIds: data.assignedClinicIds,
    invitedByDoctorId: data.doctorId,
    inviteStatus: "invited",
    createdAt: now,
    updatedAt: now,
  };

  await receptionistsCol().doc(userRecord.uid).set(clean(profile));

  // Return the temp password so the doctor can share it
  return tempPassword;
}

export async function removeReceptionist(uid: string) {
  await receptionistsCol().doc(uid).delete();
  try {
    await admin.auth().deleteUser(uid);
  } catch {
    // User might already be deleted
  }
}

// ─── Notifications ────────────────────────────────────────
export async function addNotification(
  data: Omit<NotificationDoc, "id" | "createdAt" | "read"> & { read?: boolean }
): Promise<string> {
  const ref = notificationsCol().doc();
  const doc: NotificationDoc = {
    id: ref.id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    appointmentId: data.appointmentId,
    link: data.link,
    read: data.read ?? false,
    createdAt: new Date().toISOString(),
  };
  await ref.set(clean(doc));
  return ref.id;
}

/** Fan out the same notification to multiple recipients. */
export async function notifyMany(
  userIds: string[],
  payload: { type: NotificationType; title: string; message: string; appointmentId?: string; link?: string }
) {
  await Promise.all(
    userIds.map((uid) =>
      addNotification({
        userId: uid,
        ...payload,
      })
    )
  );
}

export async function listNotificationsByUser(
  userId: string,
  limit = 50
): Promise<NotificationDoc[]> {
  const snap = await notificationsCol()
    .where("userId", "==", userId)
    .limit(limit)
    .get();
  const docs = snap.docs.map((d) => d.data() as NotificationDoc);
  return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const batch = firestore.batch();
  if (ids && ids.length > 0) {
    for (const id of ids) {
      batch.update(notificationsCol().doc(id), { read: true });
    }
  } else {
    const snap = await notificationsCol()
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  }
  await batch.commit();
}

// ─── Appointment maintenance (lazy cron) ──────────────────
const HOUR_MS = 60 * 60 * 1000;

/**
 * Run lazy maintenance on all non-final appointments:
 *  - Cancel any "pending" appointment older than 1 hour from createdAt.
 *  - Auto-complete confirmed appointments past their end time when:
 *      • neither party confirmed and ≥ 24h past end, OR
 *      • exactly one party confirmed and ≥ 12h since their confirmation.
 *
 * Notifications are emitted for every state change so dashboards can pick them up.
 *
 * Idempotent + safe to run on every appointments GET — bounded by the number
 * of in-flight appointments which is small at our scale.
 */
export async function runAppointmentMaintenance(): Promise<void> {
  const now = Date.now();

  // 1) Auto-cancel pending appointments older than 1 hour.
  const pendingSnap = await appointmentsCol().where("status", "==", "pending").get();
  for (const d of pendingSnap.docs) {
    const a = d.data() as Appointment;
    const created = Date.parse(a.createdAt || "");
    const stale = !Number.isFinite(created) || now - created >= HOUR_MS;
    if (!stale) continue;

    await d.ref.update({
      status: "cancelled",
      cancelledBy: "system",
      cancelReason: "Auto-cancelled: payment not completed within 1 hour.",
      updatedAt: new Date().toISOString(),
    });
    await notifyMany([a.patientId, a.doctorId], {
      type: "auto-cancelled",
      title: "Appointment auto-cancelled",
      message: `Pending appointment with ${a.doctorName} on ${a.date} at ${a.timeSlot} was auto-cancelled because payment was not completed within 1 hour.`,
      appointmentId: a.id,
    });
  }

  // 1b) Auto-confirm patient reschedule responses: when the doctor proposed a
  // new time, the patient must confirm/reject. Auto-confirm after 6 hours, OR
  // ≤ 1 hour before the appointment start (whichever comes first).
  const pendingReschedSnap = await appointmentsCol()
    .where("pendingPatientConfirmation", "==", true)
    .get();
  for (const d of pendingReschedSnap.docs) {
    const a = d.data() as Appointment;
    const proposedAt = Date.parse(a.rescheduleProposedAt || "");
    const proposedAge = Number.isFinite(proposedAt) ? now - proposedAt : Infinity;
    let start: Date;
    try {
      start = _appointmentStart(a.date, a.timeSlot);
    } catch {
      continue;
    }
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) continue;
    const untilStart = start.getTime() - now;
    const sixHoursElapsed = proposedAge >= 6 * HOUR_MS;
    const oneHourBeforeStart = untilStart <= HOUR_MS;
    if (!sixHoursElapsed && !oneHourBeforeStart) continue;

    await d.ref.update({
      pendingPatientConfirmation: false,
      updatedAt: new Date().toISOString(),
    });
    await notifyMany([a.patientId, a.doctorId], {
      type: "auto-confirmed",
      title: "Reschedule auto-confirmed",
      message: `The rescheduled appointment with ${a.doctorName} on ${a.date} at ${a.timeSlot} was auto-confirmed.`,
      appointmentId: a.id,
    });
  }

  // 2) Auto-complete confirmed appointments past their end window.
  const confirmedSnap = await appointmentsCol().where("status", "==", "confirmed").get();
  for (const d of confirmedSnap.docs) {
    const a = d.data() as Appointment;
    const slotMins = a.slotDuration ?? DEFAULT_SLOT_DURATION_MINUTES;
    let end: Date;
    try {
      end = _appointmentEnd(a.date, a.timeSlot, slotMins);
    } catch {
      continue;
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) continue;
    if (now < end.getTime()) continue;

    const docConf = a.doctorConfirmedCompleted === true;
    const patConf = a.patientConfirmedCompleted === true;
    if (docConf && patConf) continue; // PATCH path handles dual-confirm

    let shouldAutoComplete = false;
    let autoConfirmedBy: "doctor" | "patient" | "both" | null = null;

    if (!docConf && !patConf) {
      if (now - end.getTime() >= 24 * HOUR_MS) {
        shouldAutoComplete = true;
        autoConfirmedBy = "both";
      }
    } else if (docConf && !patConf) {
      const since = Date.parse(a.doctorConfirmedAt || "");
      if (Number.isFinite(since) && now - since >= 12 * HOUR_MS) {
        shouldAutoComplete = true;
        autoConfirmedBy = "patient";
      }
    } else if (!docConf && patConf) {
      const since = Date.parse(a.patientConfirmedAt || "");
      if (Number.isFinite(since) && now - since >= 12 * HOUR_MS) {
        shouldAutoComplete = true;
        autoConfirmedBy = "doctor";
      }
    }

    if (!shouldAutoComplete) continue;

    const completedAt = new Date().toISOString();
    const update: Partial<Appointment> = {
      status: "completed",
      completedAt,
      doctorConfirmedCompleted: true,
      patientConfirmedCompleted: true,
      autoConfirmedBy: autoConfirmedBy ?? undefined,
    };
    if (autoConfirmedBy === "doctor" || autoConfirmedBy === "both") {
      update.doctorConfirmedAt = update.doctorConfirmedAt ?? completedAt;
    }
    if (autoConfirmedBy === "patient" || autoConfirmedBy === "both") {
      update.patientConfirmedAt = update.patientConfirmedAt ?? completedAt;
    }
    if (a.payment && a.payment.status === "held") {
      update.payment = {
        ...a.payment,
        status: "released",
        releasedAt: completedAt,
      };
    }
    await d.ref.update(clean({ ...update, updatedAt: completedAt }));

    await notifyMany([a.patientId, a.doctorId], {
      type: "auto-confirmed",
      title: "Appointment auto-confirmed",
      message: `Your appointment with ${a.doctorName} on ${a.date} at ${a.timeSlot} was auto-confirmed and marked completed.`,
      appointmentId: a.id,
    });
  }
}

/**
 * One-shot helper used by the dev script: cancel ALL pending appointments
 * regardless of age. Called once on the next appointments GET.
 */
export async function cancelAllPendingAppointments(): Promise<number> {
  const snap = await appointmentsCol().where("status", "==", "pending").get();
  let n = 0;
  for (const d of snap.docs) {
    const a = d.data() as Appointment;
    await d.ref.update({
      status: "cancelled",
      cancelledBy: "system",
      cancelReason: "Auto-cancelled: pending payment not completed.",
      updatedAt: new Date().toISOString(),
    });
    await notifyMany([a.patientId, a.doctorId], {
      type: "auto-cancelled",
      title: "Pending appointment cancelled",
      message: `Your pending appointment with ${a.doctorName} on ${a.date} at ${a.timeSlot} has been cancelled because payment was not completed.`,
      appointmentId: a.id,
    });
    n++;
  }
  return n;
}
