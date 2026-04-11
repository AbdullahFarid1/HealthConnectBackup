import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  createAppointment,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  listAppointmentsForReceptionist,
  getClinic,
  todayInAppTz,
  isValidDateString,
  SlotAlreadyBookedError,
  listAvailabilityByDoctor,
  listAppointmentsByDoctorForDate,
  generateSlots,
  getAppointment,
  updateAppointment,
  updateAppointmentWithAudit,
  rescheduleAppointment,
  notifyMany,
  runAppointmentMaintenance,
  cancelAllPendingAppointments,
  upsertReview,
  hasCompletedAppointmentBetween,
  propagateRatingToCompletedAppointments,
  receptionistCan,
} from "@/lib/firebase/firestore";
import { USER_ROLES, type UserRole, type ReceptionistPermissions } from "@/types";
import type { Appointment, AppointmentPayment, SlotDuration, AvailabilityDoc } from "@/types";
import { computeFees, computeRefund } from "@/lib/fees";
import {
  canDoctorModify,
  canPatientModify,
  appointmentEnd,
  DEFAULT_SLOT_DURATION_MINUTES,
  isWithinDoctorWindow,
  appointmentStart,
} from "@/lib/policy";

/** Format a doctor's name with a "Dr." prefix unless it already has one. */
function withDoctorTitle(name: string): string {
  const n = (name ?? "").trim();
  if (!n) return "your doctor";
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

/**
 * Role-aware notification fan-out for a patient + doctor pair. The patient
 * sees the doctor's name (with "Dr." prefix); the doctor sees the patient's
 * name. Keeps notification context correct for each recipient.
 */
async function notifyAppointmentParties(
  appt: Pick<Appointment, "patientId" | "doctorId" | "patientName" | "doctorName">,
  opts: {
    type: Parameters<typeof notifyMany>[1]["type"];
    title: string;
    appointmentId?: string;
    /** Builds the body text from the counterparty label — i.e. the other person in the appointment. */
    message: (counterparty: string) => string;
    /** Optional per-role title override. */
    patientTitle?: string;
    doctorTitle?: string;
  }
) {
  const doctorDisplay = withDoctorTitle(appt.doctorName);
  const patientDisplay = (appt.patientName ?? "").trim() || "the patient";
  await Promise.all([
    notifyMany([appt.patientId], {
      type: opts.type,
      title: opts.patientTitle ?? opts.title,
      message: opts.message(doctorDisplay),
      appointmentId: opts.appointmentId,
    }),
    notifyMany([appt.doctorId], {
      type: opts.type,
      title: opts.doctorTitle ?? opts.title,
      message: opts.message(patientDisplay),
      appointmentId: opts.appointmentId,
    }),
  ]);
}

// One-shot toggle for the "immediately cancel all existing pending appointments"
// requirement. Resets when the dev server restarts; safe because the operation
// is idempotent (only pending → cancelled).
let pendingCleanupRan = false;
async function ensurePendingCleanup() {
  if (pendingCleanupRan) return;
  pendingCleanupRan = true;
  try {
    await cancelAllPendingAppointments();
  } catch {
    pendingCleanupRan = false;
  }
}

/** Find which availability block a chosen slot belongs to so we can store its duration. */
function findSlotDurationForSlot(
  availability: AvailabilityDoc[],
  date: string,
  timeSlot: string
): SlotDuration | undefined {
  // Re-generate per-block slots and check membership.
  for (const block of availability) {
    const blockApplies =
      block.repeatWeekly === false
        ? block.specificDate === date
        : true;
    if (!blockApplies) continue;
    const slots = generateSlots([block], date);
    if (slots.includes(timeSlot)) return block.slotDuration;
  }
  return undefined;
}

/**
 * POST   /api/appointments — create a new appointment (after simulated payment)
 *   Body: { doctorId, clinicId, date, timeSlot, type?, notes?, paymentConfirmed: true }
 *
 * GET    /api/appointments — list appointments for the current user
 *
 * PATCH  /api/appointments — perform an action on an appointment
 *   Body: { id, action: "cancel" | "reschedule" | "doctor-confirm-complete" |
 *                       "patient-confirm-complete" | "rate", ... }
 */
export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const patient = await getUserProfile(uid);
  if (!patient) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const doctorId = body.doctorId ?? body.dentistId;
  if (!doctorId || !body.date || !body.timeSlot || !body.clinicId) {
    return NextResponse.json(
      { error: "doctorId, clinicId, date, and timeSlot are required" },
      { status: 400 }
    );
  }

  if (!body.paymentConfirmed) {
    return NextResponse.json(
      { error: "Payment must be completed before booking can be confirmed." },
      { status: 402 }
    );
  }

  if (!isValidDateString(body.date)) {
    return NextResponse.json({ error: "Invalid date format (expected YYYY-MM-DD)" }, { status: 400 });
  }
  if (body.date < todayInAppTz()) {
    return NextResponse.json(
      { error: "Cannot book appointments in the past" },
      { status: 400 }
    );
  }

  const doctor = await getUserProfile(doctorId, USER_ROLES.DOCTOR);
  if (!doctor || doctor.role !== USER_ROLES.DOCTOR) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const clinic = await getClinic(body.clinicId);
  if (!clinic || clinic.doctorId !== doctorId) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  // Validate slot is real and free
  const availability = await listAvailabilityByDoctor(doctorId);
  const validSlots = generateSlots(availability, body.date);
  if (!validSlots.includes(body.timeSlot)) {
    return NextResponse.json({ error: "Invalid time slot for this doctor on this date" }, { status: 400 });
  }
  const sameDayBooked = await listAppointmentsByDoctorForDate(doctorId, body.date);
  if (sameDayBooked.some((a) => a.timeSlot === body.timeSlot && a.status !== "cancelled")) {
    return NextResponse.json({ error: "This time slot is no longer available." }, { status: 409 });
  }

  const breakdown = computeFees(doctor.consultationFee ?? 0);
  const nowISO = new Date().toISOString();
  const payment: AppointmentPayment = {
    ...breakdown,
    status: "held",
    paidAt: nowISO,
  };

  const slotDuration = findSlotDurationForSlot(availability, body.date, body.timeSlot);

  // Patient auto-fill: snapshot the patient's phone + age from their profile.
  // Body overrides are ignored unless the profile is missing the value, so the
  // booking card always reflects the canonical patient profile.
  const snapshotName = (patient.name ?? "").trim() || (typeof body.patientName === "string" ? body.patientName : "");
  const snapshotPhone =
    (patient.phone ?? "").trim() ||
    (typeof body.patientPhone === "string" ? body.patientPhone : "");
  let snapshotAge: number | undefined;
  if (typeof patient.age === "number") {
    snapshotAge = patient.age;
  } else if (typeof patient.dob === "string" && patient.dob) {
    const d = new Date(`${patient.dob}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
      if (years >= 0 && years <= 120) snapshotAge = years;
    }
  } else if (body.patientAge !== undefined && body.patientAge !== null && body.patientAge !== "") {
    const n = Number(body.patientAge);
    if (Number.isInteger(n) && n >= 0 && n <= 120) snapshotAge = n;
  }

  try {
    const id = await createAppointment({
      patientId: uid,
      patientName: snapshotName,
      patientPhone: snapshotPhone || undefined,
      patientAge: snapshotAge,
      doctorId: doctorId,
      doctorName: doctor.name,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date: body.date,
      timeSlot: body.timeSlot,
      slotDuration,
      type: body.type ?? "Consultation",
      // Payment held → appointment is immediately confirmed (escrow logic).
      status: "confirmed",
      notes: body.notes ?? "",
      payment,
      createdAt: nowISO,
      updatedAt: nowISO,
    });
    await notifyAppointmentParties(
      {
        patientId: uid,
        doctorId,
        patientName: patient.name,
        doctorName: doctor.name,
      },
      {
        type: "booked",
        title: "Appointment booked",
        appointmentId: id,
        message: (counterparty) =>
          `Appointment with ${counterparty} on ${body.date} at ${body.timeSlot} is confirmed.`,
      }
    );
    return NextResponse.json({ status: "created", id, payment });
  } catch (err) {
    if (err instanceof SlotAlreadyBookedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Lazy maintenance: cancel pending → 1h, auto-confirm completions past their windows.
  // Idempotent and bounded by in-flight appointment count.
  await ensurePendingCleanup();
  try {
    await runAppointmentMaintenance();
  } catch {
    // Maintenance failures should not block list responses.
  }

  const appointments =
    profile.role === USER_ROLES.DOCTOR
      ? await listAppointmentsByDoctor(uid)
      : profile.role === USER_ROLES.RECEPTION
        ? await listAppointmentsForReceptionist(uid)
        : await listAppointmentsByPatient(uid);

  return NextResponse.json(appointments);
}

// ─── Action handler ──────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required" }, { status: 400 });
  }

  const appt = await getAppointment(id);
  if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  const isPatient = appt.patientId === uid && profile.role === USER_ROLES.PATIENT;
  const isDoctor = appt.doctorId === uid && profile.role === USER_ROLES.DOCTOR;
  const isReception = profile.role === USER_ROLES.RECEPTION;

  if (!isPatient && !isDoctor && !isReception) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Receptionists act on behalf of a doctor — gate every mutation on both
  // their link to that doctor and the specific permission for the action.
  if (isReception) {
    const permMap: Record<string, keyof ReceptionistPermissions | null> = {
      cancel: "cancel",
      reschedule: "reschedule",
      "mark-arrived": "manageQueue",
      "mark-in-progress": "manageQueue",
      "mark-done": "manageQueue",
      "mark-complete": "markCompletion",
    };
    const needed = permMap[action];
    if (!needed) {
      return NextResponse.json(
        { error: "Receptionists cannot perform this action" },
        { status: 403 }
      );
    }
    const allowed = await receptionistCan(uid, appt.doctorId, needed);
    if (!allowed) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }
  }

  const actor: { uid: string; role: UserRole } = { uid, role: profile.role };

  switch (action) {
    case "cancel": {
      const by: "patient" | "doctor" = isPatient ? "patient" : "doctor";
      return handleCancel(appt, by, body.reason, actor);
    }
    case "reschedule": {
      const by: "patient" | "doctor" = isPatient ? "patient" : "doctor";
      return handleReschedule(appt, by, body.newDate, body.newTimeSlot, body.reason, actor);
    }
    case "patient-confirm-reschedule":
      if (!isPatient) return NextResponse.json({ error: "Only patient can do this" }, { status: 403 });
      return handlePatientConfirmReschedule(appt);
    case "patient-reject-reschedule":
      if (!isPatient) return NextResponse.json({ error: "Only patient can do this" }, { status: 403 });
      return handleRejectReschedule(appt, body.reason);
    case "doctor-confirm-complete":
      if (!isDoctor) return NextResponse.json({ error: "Only doctor can do this" }, { status: 403 });
      return handleDoctorConfirm(appt);
    case "patient-confirm-complete":
      if (!isPatient) return NextResponse.json({ error: "Only patient can do this" }, { status: 403 });
      return handlePatientConfirm(appt);
    case "mark-complete":
      // Reception-only shortcut that marks both sides as confirmed.
      return handleReceptionMarkComplete(appt, actor);
    case "mark-arrived":
    case "mark-in-progress":
    case "mark-done":
      return handleCheckInTransition(appt, action, actor);
    case "rate":
      if (!isPatient) return NextResponse.json({ error: "Only patient can rate" }, { status: 403 });
      return handleRate(appt, profile.name, body.doctorRating, body.platformRating, body.feedback);
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

async function handleCheckInTransition(
  appt: Appointment,
  action: "mark-arrived" | "mark-in-progress" | "mark-done",
  actor: { uid: string; role: UserRole }
) {
  const nextStatus =
    action === "mark-arrived" ? "arrived" : action === "mark-in-progress" ? "in-progress" : "done";
  await updateAppointmentWithAudit(
    appt.id,
    {
      checkInStatus: nextStatus,
      checkInUpdatedAt: new Date().toISOString(),
    },
    { action, uid: actor.uid, role: actor.role }
  );
  if (nextStatus === "arrived") {
    await notifyMany([appt.doctorId], {
      type: "patient-arrived",
      title: "Patient arrived",
      message: `${appt.patientName} has checked in for their ${appt.timeSlot} appointment.`,
      appointmentId: appt.id,
    });
  }
  return NextResponse.json({ status: "updated", checkInStatus: nextStatus });
}

async function handleReceptionMarkComplete(
  appt: Appointment,
  actor: { uid: string; role: UserRole }
) {
  if (appt.status === "completed") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }
  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Cannot complete a cancelled appointment" }, { status: 400 });
  }
  const nowISO = new Date().toISOString();
  const updates: Partial<Appointment> = {
    status: "completed",
    doctorConfirmedCompleted: true,
    doctorConfirmedAt: nowISO,
    patientConfirmedCompleted: true,
    patientConfirmedAt: nowISO,
    completedAt: nowISO,
    autoConfirmedBy: "both",
    checkInStatus: "done",
    checkInUpdatedAt: nowISO,
  };
  if (appt.payment && appt.payment.status === "held") {
    updates.payment = {
      ...appt.payment,
      status: "released",
      releasedAt: nowISO,
    };
  }
  await updateAppointmentWithAudit(appt.id, updates, {
    action: "mark-complete",
    uid: actor.uid,
    role: actor.role,
    note: "Marked complete by reception",
  });
  await notifyAppointmentParties(appt, {
    type: "completed",
    title: "Appointment completed",
    appointmentId: appt.id,
    message: (counterparty) =>
      `Your appointment with ${counterparty} on ${appt.date} at ${appt.timeSlot} was marked complete.`,
  });
  return NextResponse.json({ status: "completed" });
}

async function handleCancel(
  appt: Appointment,
  by: "patient" | "doctor",
  reason: string | undefined,
  actor: { uid: string; role: UserRole }
) {
  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }
  if (appt.status === "completed") {
    return NextResponse.json({ error: "Cannot cancel a completed appointment" }, { status: 400 });
  }

  const policy =
    by === "doctor"
      ? canDoctorModify(appt.date, appt.timeSlot)
      : canPatientModify(appt.date, appt.timeSlot, appt.createdAt);
  if (!policy.allowed) {
    return NextResponse.json({ error: policy.reason }, { status: 400 });
  }

  // Refund: total - 2% platform fee (platform always keeps 2%).
  const nowISO = new Date().toISOString();
  const updates: Partial<Appointment> = {
    status: "cancelled",
    cancelledBy: by,
    cancelReason: reason ?? "",
  };
  if (appt.payment && appt.payment.status === "held") {
    const refundAmount = computeRefund(appt.payment);
    updates.payment = {
      ...appt.payment,
      status: "refunded",
      refundedAt: nowISO,
      refundAmount,
    };
  }
  await updateAppointmentWithAudit(appt.id, updates, {
    action: "cancel",
    uid: actor.uid,
    role: actor.role,
    note: reason,
  });
  const refundSuffix = updates.payment?.refundAmount
    ? ` Refund of PKR ${updates.payment.refundAmount.toLocaleString()} will be processed within 24 hours.`
    : "";
  await notifyAppointmentParties(appt, {
    type: "cancelled",
    title: "Appointment cancelled",
    appointmentId: appt.id,
    message: (counterparty) =>
      `Appointment with ${counterparty} on ${appt.date} at ${appt.timeSlot} was cancelled by the ${by}.${refundSuffix}`,
  });
  return NextResponse.json({ status: "cancelled", refundAmount: updates.payment?.refundAmount ?? 0 });
}

async function handleReschedule(
  appt: Appointment,
  by: "patient" | "doctor",
  newDate: string | undefined,
  newTimeSlot: string | undefined,
  reason: string | undefined,
  actor: { uid: string; role: UserRole }
) {
  if (appt.status === "cancelled" || appt.status === "completed") {
    return NextResponse.json({ error: "Cannot reschedule this appointment" }, { status: 400 });
  }
  if (!newDate || !newTimeSlot) {
    return NextResponse.json({ error: "newDate and newTimeSlot are required" }, { status: 400 });
  }
  if (!isValidDateString(newDate)) {
    return NextResponse.json({ error: "Invalid newDate" }, { status: 400 });
  }
  if (newDate < todayInAppTz()) {
    return NextResponse.json({ error: "newDate cannot be in the past" }, { status: 400 });
  }

  const policy =
    by === "doctor"
      ? canDoctorModify(appt.date, appt.timeSlot)
      : canPatientModify(appt.date, appt.timeSlot, appt.createdAt);
  if (!policy.allowed) {
    return NextResponse.json({ error: policy.reason }, { status: 400 });
  }

  // Doctors can reschedule into any 30-min slot in the 8 AM – 11 PM window —
  // they're not constrained to their availability blocks. Patients still must
  // pick a published availability slot.
  const availability = await listAvailabilityByDoctor(appt.doctorId);
  if (by === "doctor") {
    if (!isWithinDoctorWindow(newTimeSlot)) {
      return NextResponse.json(
        { error: "Reschedule must fall between 8:00 AM and 11:00 PM." },
        { status: 400 }
      );
    }
  } else {
    const validSlots = generateSlots(availability, newDate);
    if (!validSlots.includes(newTimeSlot)) {
      return NextResponse.json({ error: "Invalid time slot for this doctor on the new date" }, { status: 400 });
    }
  }

  // The new slot start must be in the future.
  const newStart = appointmentStart(newDate, newTimeSlot);
  if (newStart.getTime() <= Date.now()) {
    return NextResponse.json({ error: "The new time slot is in the past." }, { status: 400 });
  }

  const sameDay = await listAppointmentsByDoctorForDate(appt.doctorId, newDate);
  if (sameDay.some((a) => a.id !== appt.id && a.timeSlot === newTimeSlot && a.status !== "cancelled")) {
    return NextResponse.json({ error: "The new time slot is already booked." }, { status: 409 });
  }

  const history = appt.rescheduleHistory ?? [];
  history.push({
    fromDate: appt.date,
    fromTimeSlot: appt.timeSlot,
    by,
    reason: reason ?? "",
    at: new Date().toISOString(),
  });

  // Reset completion confirmations on reschedule — the appointment hasn't happened yet.
  const newSlotDuration =
    findSlotDurationForSlot(availability, newDate, newTimeSlot) ??
    (by === "doctor" ? 30 : undefined);

  // When the doctor reschedules, the patient must confirm or reject before the
  // new slot starts. Auto-confirmation is handled by the maintenance pass.
  const pendingPatientConfirmation = by === "doctor";
  const rescheduleProposedAt = by === "doctor" ? new Date().toISOString() : undefined;

  try {
    const newId = await rescheduleAppointment(appt.id, newDate, newTimeSlot, {
      rescheduledBy: by,
      rescheduleReason: reason ?? "",
      rescheduleHistory: history,
      slotDuration: newSlotDuration,
      doctorConfirmedCompleted: false,
      patientConfirmedCompleted: false,
      doctorConfirmedAt: undefined,
      patientConfirmedAt: undefined,
      pendingPatientConfirmation,
      rescheduleProposedAt,
    });
    // Append audit entry to the newly created appointment doc.
    await updateAppointmentWithAudit(newId, {}, {
      action: "reschedule",
      uid: actor.uid,
      role: actor.role,
      note: reason,
    });
    const doctorDisplay = withDoctorTitle(appt.doctorName);
    const patientDisplay = (appt.patientName ?? "").trim() || "the patient";
    const patientMessage =
      by === "doctor"
        ? `${doctorDisplay} rescheduled your appointment to ${newDate} at ${newTimeSlot}. Please confirm or cancel from your dashboard. Auto-confirms after 6 hours or 1 hour before the appointment.`
        : `Appointment with ${doctorDisplay} moved from ${appt.date} ${appt.timeSlot} to ${newDate} ${newTimeSlot}.`;
    const doctorMessage =
      by === "doctor"
        ? `You rescheduled ${patientDisplay} to ${newDate} at ${newTimeSlot}. Please contact the patient (call/SMS) to confirm.`
        : `${patientDisplay} rescheduled the appointment to ${newDate} at ${newTimeSlot}.`;
    await Promise.all([
      notifyMany([appt.patientId], {
        type: "rescheduled",
        title: by === "doctor" ? "Doctor rescheduled — action needed" : "Appointment rescheduled",
        message: patientMessage,
        appointmentId: newId,
      }),
      notifyMany([appt.doctorId], {
        type: "rescheduled",
        title: "Appointment rescheduled",
        message: doctorMessage,
        appointmentId: newId,
      }),
    ]);
    return NextResponse.json({ status: "rescheduled", id: newId, pendingPatientConfirmation });
  } catch (err) {
    if (err instanceof SlotAlreadyBookedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

function ensurePastSlotEnd(appt: Appointment): NextResponse | null {
  const end = appointmentEnd(
    appt.date,
    appt.timeSlot,
    appt.slotDuration ?? DEFAULT_SLOT_DURATION_MINUTES
  );
  if (Date.now() < end.getTime()) {
    return NextResponse.json(
      { error: "You can only confirm completion after the appointment end time." },
      { status: 400 }
    );
  }
  return null;
}

async function handleDoctorConfirm(appt: Appointment) {
  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Appointment was cancelled" }, { status: 400 });
  }
  const tooEarly = ensurePastSlotEnd(appt);
  if (tooEarly) return tooEarly;

  const nowISO = new Date().toISOString();
  const updates: Partial<Appointment> = {
    doctorConfirmedCompleted: true,
    doctorConfirmedAt: nowISO,
  };
  if (appt.patientConfirmedCompleted) {
    updates.status = "completed";
    updates.completedAt = nowISO;
    if (appt.payment && appt.payment.status === "held") {
      updates.payment = {
        ...appt.payment,
        status: "released",
        releasedAt: nowISO,
      };
    }
  }
  await updateAppointment(appt.id, updates);
  if (updates.completedAt) {
    await notifyAppointmentParties(appt, {
      type: "completed",
      title: "Appointment completed",
      appointmentId: appt.id,
      message: (counterparty) =>
        `Appointment with ${counterparty} on ${appt.date} at ${appt.timeSlot} is now completed. Doctor payout released.`,
    });
  }
  return NextResponse.json({ status: "ok", completed: !!updates.completedAt });
}

async function handlePatientConfirm(appt: Appointment) {
  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Appointment was cancelled" }, { status: 400 });
  }
  const tooEarly = ensurePastSlotEnd(appt);
  if (tooEarly) return tooEarly;

  const nowISO = new Date().toISOString();
  const updates: Partial<Appointment> = {
    patientConfirmedCompleted: true,
    patientConfirmedAt: nowISO,
  };
  if (appt.doctorConfirmedCompleted) {
    updates.status = "completed";
    updates.completedAt = nowISO;
    if (appt.payment && appt.payment.status === "held") {
      updates.payment = {
        ...appt.payment,
        status: "released",
        releasedAt: nowISO,
      };
    }
  }
  await updateAppointment(appt.id, updates);
  if (updates.completedAt) {
    await notifyAppointmentParties(appt, {
      type: "completed",
      title: "Appointment completed",
      appointmentId: appt.id,
      message: (counterparty) =>
        `Appointment with ${counterparty} on ${appt.date} at ${appt.timeSlot} is now completed. Doctor payout released.`,
    });
  }
  return NextResponse.json({ status: "ok", completed: !!updates.completedAt });
}

async function handlePatientConfirmReschedule(appt: Appointment) {
  if (!appt.pendingPatientConfirmation) {
    return NextResponse.json({ error: "No pending reschedule to confirm." }, { status: 400 });
  }
  await updateAppointment(appt.id, {
    pendingPatientConfirmation: false,
  });
  const doctorDisplay = withDoctorTitle(appt.doctorName);
  const patientDisplay = (appt.patientName ?? "").trim() || "The patient";
  await Promise.all([
    notifyMany([appt.patientId], {
      type: "rescheduled",
      title: "Reschedule confirmed",
      message: `You confirmed the new time for your appointment with ${doctorDisplay} on ${appt.date} at ${appt.timeSlot}.`,
      appointmentId: appt.id,
    }),
    notifyMany([appt.doctorId], {
      type: "rescheduled",
      title: "Reschedule confirmed",
      message: `${patientDisplay} confirmed the new time for the appointment on ${appt.date} at ${appt.timeSlot}.`,
      appointmentId: appt.id,
    }),
  ]);
  return NextResponse.json({ status: "confirmed" });
}

async function handleRejectReschedule(appt: Appointment, reason: string | undefined) {
  if (!appt.pendingPatientConfirmation) {
    return NextResponse.json({ error: "No pending reschedule to reject." }, { status: 400 });
  }
  // Reject = cancel the appointment with full policy refund. We bypass the
  // ≥1-day patient policy because the patient is responding to the doctor's
  // proposed change, not initiating a normal cancellation.
  const nowISO = new Date().toISOString();
  const updates: Partial<Appointment> = {
    status: "cancelled",
    cancelledBy: "patient",
    cancelReason: reason ?? "Rejected doctor's reschedule.",
    pendingPatientConfirmation: false,
  };
  if (appt.payment && appt.payment.status === "held") {
    const refundAmount = computeRefund(appt.payment);
    updates.payment = {
      ...appt.payment,
      status: "refunded",
      refundedAt: nowISO,
      refundAmount,
    };
  }
  await updateAppointment(appt.id, updates);
  const doctorDisplay = withDoctorTitle(appt.doctorName);
  const patientDisplay = (appt.patientName ?? "").trim() || "The patient";
  const refundSuffix = updates.payment?.refundAmount
    ? ` Refund of PKR ${updates.payment.refundAmount.toLocaleString()} will be processed within 24 hours.`
    : "";
  await Promise.all([
    notifyMany([appt.patientId], {
      type: "cancelled",
      title: "Appointment cancelled",
      message: `You rejected the rescheduled time for your appointment with ${doctorDisplay} on ${appt.date} at ${appt.timeSlot}.${refundSuffix}`,
      appointmentId: appt.id,
    }),
    notifyMany([appt.doctorId], {
      type: "cancelled",
      title: "Appointment cancelled",
      message: `${patientDisplay} rejected the rescheduled time for the appointment on ${appt.date} at ${appt.timeSlot}.${refundSuffix}`,
      appointmentId: appt.id,
    }),
  ]);
  return NextResponse.json({ status: "cancelled", refundAmount: updates.payment?.refundAmount ?? 0 });
}

async function handleRate(
  appt: Appointment,
  patientName: string,
  doctorRating: unknown,
  platformRating: unknown,
  feedback: unknown
) {
  if (appt.status !== "completed") {
    return NextResponse.json({ error: "Can only rate after the appointment is completed." }, { status: 400 });
  }
  const dr = Number(doctorRating);
  const pr = Number(platformRating);
  if (!Number.isFinite(dr) || dr < 1 || dr > 5) {
    return NextResponse.json({ error: "doctorRating must be 1..5" }, { status: 400 });
  }
  if (!Number.isFinite(pr) || pr < 1 || pr > 5) {
    return NextResponse.json({ error: "platformRating must be 1..5" }, { status: 400 });
  }
  // Gate: only patients with at least one completed appointment with the doctor
  // may leave a review. The current appointment itself must be completed, so
  // this check is mostly defensive against reschedule/cancel races.
  const eligible = await hasCompletedAppointmentBetween(appt.patientId, appt.doctorId);
  if (!eligible) {
    return NextResponse.json(
      { error: "You can only review a doctor after completing at least one appointment." },
      { status: 403 }
    );
  }

  const feedbackStr = typeof feedback === "string" ? feedback : "";
  // Persist platformRating on this appointment (platform feedback is per-visit).
  await updateAppointment(appt.id, {
    platformRating: pr,
  });
  // Upsert the canonical review (one per patient+doctor) and update the doctor's
  // rating aggregate in the same transaction.
  try {
    await upsertReview({
      doctorId: appt.doctorId,
      patientId: appt.patientId,
      patientName: patientName || appt.patientName,
      rating: dr,
      comment: feedbackStr,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to record review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  // Propagate the latest rating to every completed appointment between this
  // patient and doctor so the UI is consistent across visits (one rating per
  // patient per doctor — edits overwrite everywhere).
  await propagateRatingToCompletedAppointments(
    appt.patientId,
    appt.doctorId,
    dr,
    feedbackStr
  );
  return NextResponse.json({ status: "rated" });
}
