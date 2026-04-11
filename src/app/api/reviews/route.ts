import { NextRequest, NextResponse } from "next/server";
import {
  getUidFromSession,
  getUserProfile,
  getDoctorById,
  listReviewsByDoctor,
  getReview,
  upsertReview,
  hasCompletedAppointmentBetween,
  propagateRatingToCompletedAppointments,
} from "@/lib/firebase/firestore";
import { USER_ROLES } from "@/types";

/**
 * GET /api/reviews?doctorId=... — list all reviews for a doctor (public).
 *   Also returns the doctor's rating aggregate.
 *   ?mine=1 → include the current patient's own review (if any).
 *
 * POST /api/reviews — create or update the current patient's review for a
 *   doctor. Requires at least one completed appointment with that doctor.
 *   Body: { doctorId, rating (1..5), comment? }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const mine = searchParams.get("mine");
  if (!doctorId) {
    return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const rawReviews = await listReviewsByDoctor(doctorId);
  // Privacy: strip patient names from public listings — only "Verified Patient"
  // is shown. Names remain in Firestore for moderation/audit purposes.
  const reviews = rawReviews.map((r) => ({ ...r, patientName: "" }));

  let myReview = null;
  if (mine) {
    const uid = await getUidFromSession(req.cookies.get("session")?.value);
    if (uid) {
      myReview = await getReview(doctorId, uid);
    }
  }

  return NextResponse.json({
    reviews,
    aggregate: {
      ratingAverage: doctor.ratingAverage ?? 0,
      ratingCount: doctor.ratingCount ?? 0,
    },
    myReview,
  });
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromSession(req.cookies.get("session")?.value);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(uid);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.role !== USER_ROLES.PATIENT) {
    return NextResponse.json({ error: "Only patients can leave reviews" }, { status: 403 });
  }

  const body = await req.json();
  const doctorId = typeof body.doctorId === "string" ? body.doctorId : null;
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!doctorId) {
    return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  // Gate: patient must have at least one completed appointment with this doctor.
  const eligible = await hasCompletedAppointmentBetween(uid, doctorId);
  if (!eligible) {
    return NextResponse.json(
      { error: "You can only review a doctor after completing at least one appointment." },
      { status: 403 }
    );
  }

  try {
    const { created, review } = await upsertReview({
      doctorId,
      patientId: uid,
      patientName: profile.name,
      rating,
      comment,
    });
    // Keep every completed appointment between this patient/doctor pair in sync
    // with the latest rating so the UI never shows conflicting per-visit stars.
    await propagateRatingToCompletedAppointments(uid, doctorId, rating, comment);
    return NextResponse.json({ status: created ? "created" : "updated", review });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save review";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
