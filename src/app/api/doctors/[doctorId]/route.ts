import { NextRequest, NextResponse } from "next/server";
import { getDoctorById, listClinicsByDoctor, listAvailabilityByDoctor } from "@/lib/firebase/firestore";

/**
 * GET /api/doctors/[doctorId] — get a single doctor with their clinics + availability
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params;

  const doctor = await getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const [clinics, availability] = await Promise.all([
    listClinicsByDoctor(doctorId),
    listAvailabilityByDoctor(doctorId),
  ]);

  return NextResponse.json({ doctor, clinics, availability });
}
