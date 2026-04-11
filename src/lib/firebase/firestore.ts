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
  ReviewDoc,
  ReceptionistPermissions,
  DoctorInviteState,
} from "@/types";
import {
  USER_ROLES,
  DEFAULT_RECEPTIONIST_PERMISSIONS,
  INVITE_EXPIRY_MS,
} from "@/types";
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
const reviewsCol = () => firestore.collection("reviews");

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
 * Partial update with an audit entry appended. Pass the acting user so we can
 * record both the lightweight `actionBy` pointer and the full `actionHistory`
 * trail. Safe to call from any role (patient, doctor, reception).
 */
export async function updateAppointmentWithAudit(
  id: string,
  data: Partial<Appointment>,
  audit: {
    action: string;
    uid: string;
    role: UserRole;
    note?: string;
  }
) {
  const ref = appointmentsCol().doc(id);
  const nowISO = new Date().toISOString();
  const entry = {
    action: audit.action,
    uid: audit.uid,
    role: audit.role,
    at: nowISO,
    ...(audit.note ? { note: audit.note } : {}),
  };
  await ref.update(
    clean({
      ...data,
      actionBy: { uid: audit.uid, role: audit.role, at: nowISO },
      actionHistory: admin.firestore.FieldValue.arrayUnion(entry) as unknown as Appointment["actionHistory"],
      updatedAt: nowISO,
    })
  );
}

/**
 * Aggregate appointments for every doctor a receptionist is actively linked
 * to. Only active invites (accepted or active) contribute. Results are
 * deduped by id and sorted newest-first.
 */
export async function listAppointmentsForReceptionist(
  receptionistUid: string
): Promise<Appointment[]> {
  const profile = await getReceptionistProfile(receptionistUid);
  if (!profile) return [];
  const statuses = profile.doctorInviteStatuses ?? {};
  const doctorIds = Object.entries(statuses)
    .filter(([, s]) => s.status === "accepted" || s.status === "active")
    .map(([id]) => id);
  if (doctorIds.length === 0) return [];

  const all: Appointment[] = [];
  for (const doctorId of doctorIds) {
    const docs = await listAppointmentsByDoctor(doctorId);
    all.push(...docs);
  }
  // Dedupe by id in case of any overlaps.
  const byId = new Map<string, Appointment>();
  for (const a of all) byId.set(a.id, a);
  return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * True if the given receptionist has an active link to the given doctor AND
 * has the specified permission enabled. Used by API routes to gate writes.
 */
export async function receptionistCan(
  receptionistUid: string,
  doctorId: string,
  permission: keyof ReceptionistPermissions
): Promise<boolean> {
  const profile = await getReceptionistProfile(receptionistUid);
  if (!profile) return false;
  const state = profile.doctorInviteStatuses?.[doctorId];
  if (!state || (state.status !== "accepted" && state.status !== "active")) {
    return false;
  }
  const perms = profile.doctorPermissions?.[doctorId];
  if (!perms) return false;
  return Boolean(perms[permission]);
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

// ─── Receptionists (multi-doctor, permission-based) ───────

/**
 * Look up any existing user by email across all role collections. Returns
 * the first match's role and uid so the caller can decide whether to link
 * or block (we never allow a non-receptionist user to be turned into one).
 */
export async function findUserByEmail(
  email: string
): Promise<{ uid: string; role: UserRole; profile: UserProfileDoc } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const cols: Array<{ col: FirebaseFirestore.CollectionReference; role: UserRole }> = [
    { col: receptionistsCol(), role: USER_ROLES.RECEPTION },
    { col: doctorsCol(), role: USER_ROLES.DOCTOR },
    { col: patientsCol(), role: USER_ROLES.PATIENT },
    { col: adminsCol(), role: USER_ROLES.ADMIN },
  ];
  for (const { col, role } of cols) {
    const snap = await col.where("email", "==", normalized).limit(1).get();
    if (!snap.empty) {
      const profile = snap.docs[0].data() as UserProfileDoc;
      return { uid: profile.uid, role, profile };
    }
  }
  // Case-insensitive fallback: older docs may have stored a mixed-case email.
  // We skip this in the hot path (equality above is much faster) but fall
  // back to linear scan on miss so legacy data still matches.
  for (const { col, role } of cols) {
    const snap = await col.get();
    for (const d of snap.docs) {
      const prof = d.data() as UserProfileDoc;
      if ((prof.email ?? "").trim().toLowerCase() === normalized) {
        return { uid: prof.uid, role, profile: prof };
      }
    }
  }
  return null;
}

/**
 * List every receptionist linked to this doctor. Expired invites are
 * auto-materialized on read so the UI always reflects current state.
 */
export async function listReceptionistsByDoctor(
  doctorId: string
): Promise<UserProfileDoc[]> {
  const snap = await receptionistsCol()
    .where("role", "==", USER_ROLES.RECEPTION)
    .where("invitedByDoctorIds", "array-contains", doctorId)
    .get();
  const docs = snap.docs.map((d) => d.data() as UserProfileDoc);
  // Lazy-expire stale invites so the UI shows them accurately.
  const now = Date.now();
  for (const r of docs) {
    const state = r.doctorInviteStatuses?.[doctorId];
    if (state && state.status === "invited") {
      const expiresAt = Date.parse(state.expiresAt);
      if (!Number.isNaN(expiresAt) && expiresAt <= now) {
        await receptionistsCol().doc(r.uid).update({
          [`doctorInviteStatuses.${doctorId}.status`]: "expired",
          updatedAt: new Date().toISOString(),
        });
        state.status = "expired";
      }
    }
  }
  return docs;
}

/** Default permissions: everything enabled. */
export function defaultReceptionistPermissions(): ReceptionistPermissions {
  return { ...DEFAULT_RECEPTIONIST_PERMISSIONS };
}

/**
 * Create a brand-new receptionist account (Firebase Auth + Firestore profile)
 * linked to the inviting doctor. Returns the temporary password so the doctor
 * can share it once — storage-side we only persist `mustResetPassword: true`.
 */
export async function createReceptionistInvite(data: {
  name: string;
  email: string;
  phone: string;
  clinicIds: string[];
  doctorId: string;
  permissions?: ReceptionistPermissions;
}): Promise<{ uid: string; tempPassword: string; profile: UserProfileDoc }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  // Guard: if a user with this email already exists in ANY collection,
  // we should not silently create a new account. The caller (API layer)
  // decides whether to link existing or error out.
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error(
      `A user with email ${normalizedEmail} already exists. Use "Link existing" instead.`
    );
  }

  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const userRecord = await admin.auth().createUser({
    email: normalizedEmail,
    password: tempPassword,
    displayName: data.name,
    phoneNumber: data.phone.startsWith("+") ? data.phone : undefined,
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, { role: USER_ROLES.RECEPTION });

  const now = new Date();
  const nowISO = now.toISOString();
  const expiresAtISO = new Date(now.getTime() + INVITE_EXPIRY_MS).toISOString();

  const inviteState: DoctorInviteState = {
    status: "invited",
    invitedAt: nowISO,
    expiresAt: expiresAtISO,
    clinicIds: data.clinicIds,
  };

  const profile: UserProfileDoc = {
    uid: userRecord.uid,
    name: data.name,
    email: normalizedEmail,
    phone: data.phone,
    role: USER_ROLES.RECEPTION,
    invitedByDoctorIds: [data.doctorId],
    doctorInviteStatuses: { [data.doctorId]: inviteState },
    doctorPermissions: {
      [data.doctorId]: data.permissions ?? defaultReceptionistPermissions(),
    },
    mustResetPassword: true,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  await receptionistsCol().doc(userRecord.uid).set(clean(profile));

  return { uid: userRecord.uid, tempPassword, profile };
}

/**
 * Link an existing receptionist to a new doctor. Fails if the target user
 * exists but has a non-reception role (no multi-role users allowed).
 * Returns the updated profile.
 */
export async function linkExistingReceptionist(data: {
  email: string;
  clinicIds: string[];
  doctorId: string;
  permissions?: ReceptionistPermissions;
}): Promise<UserProfileDoc> {
  const existing = await findUserByEmail(data.email);
  if (!existing) {
    throw new Error("No user found with that email.");
  }
  if (existing.role !== USER_ROLES.RECEPTION) {
    throw new Error(
      `This email belongs to a ${existing.role} account. Users cannot hold multiple roles.`
    );
  }

  const profile = existing.profile;
  // Already linked? Refresh the invite to re-send.
  const doctorIds = new Set(profile.invitedByDoctorIds ?? []);
  doctorIds.add(data.doctorId);

  const now = new Date();
  const nowISO = now.toISOString();
  const expiresAtISO = new Date(now.getTime() + INVITE_EXPIRY_MS).toISOString();

  const prevState = profile.doctorInviteStatuses?.[data.doctorId];
  // If the receptionist has already accepted/is active for this doctor,
  // linking again is a no-op (just return the current profile).
  if (prevState && (prevState.status === "accepted" || prevState.status === "active")) {
    return profile;
  }

  const newState: DoctorInviteState = {
    status: "invited",
    invitedAt: nowISO,
    expiresAt: expiresAtISO,
    clinicIds: data.clinicIds,
  };

  const permissions = { ...(profile.doctorPermissions ?? {}) };
  permissions[data.doctorId] =
    data.permissions ?? permissions[data.doctorId] ?? defaultReceptionistPermissions();

  const updated: Partial<UserProfileDoc> = {
    invitedByDoctorIds: Array.from(doctorIds),
    doctorInviteStatuses: {
      ...(profile.doctorInviteStatuses ?? {}),
      [data.doctorId]: newState,
    },
    doctorPermissions: permissions,
    updatedAt: nowISO,
  };
  await receptionistsCol().doc(profile.uid).update(clean(updated));
  return { ...profile, ...updated };
}

/** Set a receptionist's status for a specific doctor. Used by accept/reject. */
export async function setReceptionistInviteStatus(
  receptionistUid: string,
  doctorId: string,
  status: "accepted" | "active" | "rejected"
): Promise<UserProfileDoc> {
  const ref = receptionistsCol().doc(receptionistUid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Receptionist not found");
  const profile = snap.data() as UserProfileDoc;
  const state = profile.doctorInviteStatuses?.[doctorId];
  if (!state) throw new Error("No invite from that doctor.");

  // State transitions:
  //   invited  → accepted | rejected
  //   accepted → active (set implicitly after first successful login)
  //   active   → (terminal for this endpoint)
  if (status === "rejected" && state.status !== "invited") {
    throw new Error("Only pending invites can be rejected.");
  }
  if (status === "accepted" && state.status !== "invited") {
    throw new Error("Only pending invites can be accepted.");
  }

  const nowISO = new Date().toISOString();
  const nextState: DoctorInviteState = { ...state, status };
  if (status === "accepted") nextState.acceptedAt = nowISO;
  if (status === "rejected") nextState.rejectedAt = nowISO;

  const nextStatuses = {
    ...(profile.doctorInviteStatuses ?? {}),
    [doctorId]: nextState,
  };

  await ref.update(
    clean({
      doctorInviteStatuses: nextStatuses,
      updatedAt: nowISO,
    })
  );
  return { ...profile, doctorInviteStatuses: nextStatuses, updatedAt: nowISO };
}

/**
 * Transition every accepted invite for this receptionist to "active".
 * Called after the receptionist completes their forced password reset — this
 * marks them as fully onboarded.
 */
export async function activateReceptionist(
  receptionistUid: string
): Promise<void> {
  const ref = receptionistsCol().doc(receptionistUid);
  const snap = await ref.get();
  if (!snap.exists) return;
  const profile = snap.data() as UserProfileDoc;
  const statuses = { ...(profile.doctorInviteStatuses ?? {}) };
  let changed = false;
  for (const [doctorId, state] of Object.entries(statuses)) {
    if (state.status === "accepted") {
      statuses[doctorId] = { ...state, status: "active" };
      changed = true;
    }
  }
  if (!changed) return;
  await ref.update({
    doctorInviteStatuses: statuses,
    updatedAt: new Date().toISOString(),
  });
}

/** Update one doctor's permissions map for a receptionist. */
export async function updateReceptionistPermissions(
  receptionistUid: string,
  doctorId: string,
  permissions: ReceptionistPermissions
): Promise<void> {
  await receptionistsCol()
    .doc(receptionistUid)
    .update({
      [`doctorPermissions.${doctorId}`]: permissions,
      updatedAt: new Date().toISOString(),
    });
}

/** Replace the clinic assignment list for this receptionist/doctor pair. */
export async function updateReceptionistClinics(
  receptionistUid: string,
  doctorId: string,
  clinicIds: string[]
): Promise<void> {
  await receptionistsCol()
    .doc(receptionistUid)
    .update({
      [`doctorInviteStatuses.${doctorId}.clinicIds`]: clinicIds,
      updatedAt: new Date().toISOString(),
    });
}

/**
 * Remove this receptionist's association with one doctor (audit-safe
 * unlink). The Firebase Auth account and profile are preserved so the
 * receptionist can still log in and work for any other doctors.
 */
export async function unlinkReceptionistFromDoctor(
  receptionistUid: string,
  doctorId: string
): Promise<void> {
  const ref = receptionistsCol().doc(receptionistUid);
  const snap = await ref.get();
  if (!snap.exists) return;
  const profile = snap.data() as UserProfileDoc;

  const doctorIds = (profile.invitedByDoctorIds ?? []).filter((id) => id !== doctorId);
  const statuses = { ...(profile.doctorInviteStatuses ?? {}) };
  delete statuses[doctorId];
  const perms = { ...(profile.doctorPermissions ?? {}) };
  delete perms[doctorId];

  await ref.update(
    clean({
      invitedByDoctorIds: doctorIds,
      doctorInviteStatuses: statuses,
      doctorPermissions: perms,
      updatedAt: new Date().toISOString(),
    })
  );
}

/** Get the single receptionist doc — used by the /me endpoint. */
export async function getReceptionistProfile(
  uid: string
): Promise<UserProfileDoc | null> {
  const snap = await receptionistsCol().doc(uid).get();
  return snap.exists ? (snap.data() as UserProfileDoc) : null;
}

/**
 * Migrate legacy receptionist docs that use the old singular schema
 * (`invitedByDoctorId`, `assignedClinicIds`, `inviteStatus`) into the new
 * multi-doctor schema. Idempotent — safe to run multiple times.
 */
export async function runReceptionistMigration(): Promise<number> {
  const snap = await receptionistsCol().get();
  let migrated = 0;
  const nowISO = new Date().toISOString();
  for (const d of snap.docs) {
    const raw = d.data() as Record<string, unknown> & UserProfileDoc;
    const hasLegacy =
      typeof raw.invitedByDoctorId === "string" ||
      Array.isArray(raw.assignedClinicIds) ||
      typeof raw.inviteStatus === "string";
    if (!hasLegacy) continue;
    if (raw.doctorInviteStatuses && raw.invitedByDoctorIds) continue; // already new

    const doctorId = raw.invitedByDoctorId as string | undefined;
    const clinicIds = (raw.assignedClinicIds as string[] | undefined) ?? [];
    const legacyStatus = raw.inviteStatus as string | undefined;

    if (!doctorId) continue;

    const state: DoctorInviteState = {
      status:
        legacyStatus === "joined" ? "active" : "invited",
      invitedAt: (raw.createdAt as string) ?? nowISO,
      expiresAt: new Date(
        (Date.parse((raw.createdAt as string) ?? nowISO) || Date.now()) +
          INVITE_EXPIRY_MS
      ).toISOString(),
      clinicIds,
      ...(legacyStatus === "joined" ? { acceptedAt: nowISO } : {}),
    };

    const updates: Partial<UserProfileDoc> & Record<string, unknown> = {
      invitedByDoctorIds: [doctorId],
      doctorInviteStatuses: { [doctorId]: state },
      doctorPermissions: {
        [doctorId]: defaultReceptionistPermissions(),
      },
      mustResetPassword: raw.mustResetPassword ?? false,
      updatedAt: nowISO,
      // Clear legacy fields so we don't loop.
      invitedByDoctorId: admin.firestore.FieldValue.delete() as unknown as undefined,
      assignedClinicIds: admin.firestore.FieldValue.delete() as unknown as undefined,
      inviteStatus: admin.firestore.FieldValue.delete() as unknown as undefined,
    };
    await d.ref.update(updates as FirebaseFirestore.UpdateData<UserProfileDoc>);
    migrated++;
  }
  return migrated;
}

/** Auto-run the migration once per server boot so existing data upgrades itself. */
let receptionistMigrationRan = false;
export async function ensureReceptionistMigration(): Promise<void> {
  if (receptionistMigrationRan) return;
  receptionistMigrationRan = true;
  try {
    await runReceptionistMigration();
  } catch {
    receptionistMigrationRan = false;
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

/** Format a doctor's name with a "Dr." prefix unless it already has one. */
function _withDoctorTitle(name: string | undefined | null): string {
  const n = (name ?? "").trim();
  if (!n) return "your doctor";
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

/**
 * Role-aware notification for a patient + doctor pair. The patient sees the
 * doctor's name (prefixed with "Dr."); the doctor sees the patient's name.
 */
async function notifyAppointmentParties(
  appt: { patientId: string; doctorId: string; patientName?: string; doctorName?: string },
  opts: {
    type: NotificationType;
    title: string;
    appointmentId?: string;
    message: (counterparty: string) => string;
  }
) {
  const doctorDisplay = _withDoctorTitle(appt.doctorName);
  const patientDisplay = (appt.patientName ?? "").trim() || "the patient";
  await Promise.all([
    addNotification({
      userId: appt.patientId,
      type: opts.type,
      title: opts.title,
      message: opts.message(doctorDisplay),
      appointmentId: opts.appointmentId,
    }),
    addNotification({
      userId: appt.doctorId,
      type: opts.type,
      title: opts.title,
      message: opts.message(patientDisplay),
      appointmentId: opts.appointmentId,
    }),
  ]);
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
    await notifyAppointmentParties(a, {
      type: "auto-cancelled",
      title: "Appointment auto-cancelled",
      appointmentId: a.id,
      message: (counterparty) =>
        `Pending appointment with ${counterparty} on ${a.date} at ${a.timeSlot} was auto-cancelled because payment was not completed within 1 hour.`,
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
    await notifyAppointmentParties(a, {
      type: "auto-confirmed",
      title: "Reschedule auto-confirmed",
      appointmentId: a.id,
      message: (counterparty) =>
        `The rescheduled appointment with ${counterparty} on ${a.date} at ${a.timeSlot} was auto-confirmed.`,
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

    await notifyAppointmentParties(a, {
      type: "auto-confirmed",
      title: "Appointment auto-confirmed",
      appointmentId: a.id,
      message: (counterparty) =>
        `Your appointment with ${counterparty} on ${a.date} at ${a.timeSlot} was auto-confirmed and marked completed.`,
    });
  }
}

// ─── Reviews & doctor rating aggregate ────────────────────
/**
 * Deterministic review doc ID: one review per (doctor, patient) pair so
 * upserts always overwrite the previous review instead of creating duplicates.
 */
function reviewDocId(doctorId: string, patientId: string): string {
  return `${doctorId}_${patientId}`;
}

/**
 * Propagate the latest patient→doctor rating/feedback to every completed
 * appointment between that patient and doctor. Enforces the invariant that
 * each patient has a single, consistent rating per doctor across all visits.
 */
export async function propagateRatingToCompletedAppointments(
  patientId: string,
  doctorId: string,
  rating: number,
  feedback: string
): Promise<number> {
  const snap = await appointmentsCol()
    .where("patientId", "==", patientId)
    .where("doctorId", "==", doctorId)
    .where("status", "==", "completed")
    .get();
  if (snap.empty) return 0;
  const nowISO = new Date().toISOString();
  const batch = firestore.batch();
  snap.docs.forEach((d) => {
    batch.update(d.ref, {
      doctorRating: rating,
      feedback,
      updatedAt: nowISO,
    });
  });
  await batch.commit();
  return snap.size;
}

/** Returns true if the patient has at least one completed appointment with the doctor. */
export async function hasCompletedAppointmentBetween(
  patientId: string,
  doctorId: string
): Promise<boolean> {
  const snap = await appointmentsCol()
    .where("patientId", "==", patientId)
    .where("doctorId", "==", doctorId)
    .where("status", "==", "completed")
    .limit(1)
    .get();
  return !snap.empty;
}

export async function getReview(
  doctorId: string,
  patientId: string
): Promise<ReviewDoc | null> {
  const snap = await reviewsCol().doc(reviewDocId(doctorId, patientId)).get();
  return snap.exists ? (snap.data() as ReviewDoc) : null;
}

export async function listReviewsByDoctor(doctorId: string): Promise<ReviewDoc[]> {
  const snap = await reviewsCol().where("doctorId", "==", doctorId).get();
  const docs = snap.docs.map((d) => d.data() as ReviewDoc);
  return docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Upsert a patient's review of a doctor and update the doctor's rating
 * aggregate in a single transaction. The aggregate stores `ratingSum`,
 * `ratingCount`, and `ratingAverage` on the doctor profile so that
 * listing doctors never needs to scan the reviews collection.
 */
export async function upsertReview(input: {
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
}): Promise<{ created: boolean; review: ReviewDoc }> {
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("rating must be between 1 and 5");
  }
  const id = reviewDocId(input.doctorId, input.patientId);
  const ref = reviewsCol().doc(id);
  const doctorRef = doctorsCol().doc(input.doctorId);

  let created = false;
  let finalReview: ReviewDoc | null = null;

  await firestore.runTransaction(async (tx) => {
    const [prevSnap, docSnap] = await Promise.all([tx.get(ref), tx.get(doctorRef)]);
    if (!docSnap.exists) throw new Error("Doctor not found");
    const doctor = docSnap.data() as UserProfileDoc;
    if (doctor.role !== USER_ROLES.DOCTOR) throw new Error("Doctor not found");

    const nowISO = new Date().toISOString();
    const prev = prevSnap.exists ? (prevSnap.data() as ReviewDoc) : null;

    const prevSum = doctor.ratingSum ?? 0;
    const prevCount = doctor.ratingCount ?? 0;
    let nextSum: number;
    let nextCount: number;
    if (prev) {
      nextSum = prevSum - prev.rating + input.rating;
      nextCount = prevCount;
    } else {
      nextSum = prevSum + input.rating;
      nextCount = prevCount + 1;
      created = true;
    }
    const nextAvg = nextCount > 0 ? Math.round((nextSum / nextCount) * 10) / 10 : 0;

    const review: ReviewDoc = {
      id,
      doctorId: input.doctorId,
      patientId: input.patientId,
      patientName: input.patientName,
      rating: input.rating,
      comment: input.comment,
      createdAt: prev?.createdAt ?? nowISO,
      updatedAt: nowISO,
    };
    finalReview = review;

    tx.set(ref, clean(review));
    tx.update(doctorRef, {
      ratingSum: nextSum,
      ratingCount: nextCount,
      ratingAverage: nextAvg,
      updatedAt: nowISO,
    });
  });

  return { created, review: finalReview! };
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
    await notifyAppointmentParties(a, {
      type: "auto-cancelled",
      title: "Pending appointment cancelled",
      appointmentId: a.id,
      message: (counterparty) =>
        `Your pending appointment with ${counterparty} on ${a.date} at ${a.timeSlot} has been cancelled because payment was not completed.`,
    });
    n++;
  }
  return n;
}
