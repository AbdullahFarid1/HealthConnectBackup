import { NextRequest, NextResponse } from "next/server";
import { searchDoctors } from "@/lib/firebase/firestore";

/**
 * GET /api/doctors?specialty=Cardiologist&city=Lahore&q=khan
 * Returns a list of doctor profiles matching the filters.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const results = await searchDoctors({
    specialty: searchParams.get("specialty") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    limit: 20,
  });

  return NextResponse.json(results);
}
