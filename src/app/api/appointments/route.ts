import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  createAppointment,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  getClinic,
  todayInAppTz,
  isValidDateString,
  SlotAlreadyBookedError,
  listAvailabilityByDoctor,
  listAppointmentsByDoctorForDate,
  generateSlots,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * POST /api/appointments — create a new appointment
 * Body: { doctorId, clinicId, date, timeSlot, type?, notes? }
 *
 * GET /api/appointments — list appointments for the current user
 */
export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const patient = await getUserProfile(uid);
  if (!patient) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const doctorId = body.doctorId ?? body.dentistId; // accept both for backward compat
  if (!doctorId || !body.date || !body.timeSlot || !body.clinicId) {
    return NextResponse.json(
      { error: "doctorId, clinicId, date, and timeSlot are required" },
      { status: 400 }
    );
  }

  // Validate date format and reject past dates using app-timezone "today".
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

  // Validate that the requested time slot is actually one of the doctor's
  // generated slots for that date and is still free. This is the cheap pre-check;
  // the createAppointment transaction is the source of truth for atomicity.
  const availability = await listAvailabilityByDoctor(doctorId);
  const validSlots = generateSlots(availability, body.date);
  if (!validSlots.includes(body.timeSlot)) {
    return NextResponse.json({ error: "Invalid time slot for this doctor on this date" }, { status: 400 });
  }
  const sameDayBooked = await listAppointmentsByDoctorForDate(doctorId, body.date);
  if (sameDayBooked.some((a) => a.timeSlot === body.timeSlot && a.status !== "cancelled")) {
    return NextResponse.json({ error: "This time slot is no longer available." }, { status: 409 });
  }

  const nowISO = new Date().toISOString();
  try {
    const id = await createAppointment({
      patientId: uid,
      patientName: patient.name,
      doctorId: doctorId,
      doctorName: doctor.name,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date: body.date,
      timeSlot: body.timeSlot,
      type: body.type ?? "Consultation",
      status: "pending",
      notes: body.notes ?? "",
      createdAt: nowISO,
      updatedAt: nowISO,
    });
    return NextResponse.json({ status: "created", id });
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

  const appointments =
    profile.role === USER_ROLES.DOCTOR
      ? await listAppointmentsByDoctor(uid)
      : await listAppointmentsByPatient(uid);

  return NextResponse.json(appointments);
}
