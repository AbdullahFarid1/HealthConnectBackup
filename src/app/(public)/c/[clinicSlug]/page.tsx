import Link from "next/link";
import { Building2, CalendarCheck2 } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ClinicPage({
  params,
}: {
  params: { clinicSlug: string };
}) {
  const { clinicSlug } = params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Clinic
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {prettySlug(clinicSlug)}
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">
            Clinic profile page (UI preview). Add specialties, hours, and
            providers when you connect real data.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">About</p>
                  <p className="mt-1 text-sm text-slate-600">
                    A clean, modern clinic profile layout with booking entry
                    points.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-slate-900">
                Ready to book?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Choose a time that works for you.
              </p>
              <div className="mt-4">
                <Link href={`/book/${clinicSlug}`}>
                  <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                    Book an appointment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function prettySlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
