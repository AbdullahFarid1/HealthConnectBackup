import Link from "next/link";
import { CalendarCheck2, ChevronLeft } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function BookClinicPage({
  params,
}: {
  params: { clinicSlug: string };
}) {
  const { clinicSlug } = params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/c/${clinicSlug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to clinic
          </Link>
        </div>

        <div className="mx-auto max-w-md">
          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
            <CardHeader>
              <CardTitle>Book an appointment</CardTitle>
              <CardDescription>
                Booking for <span className="font-semibold">{prettySlug(clinicSlug)}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Full name
                </label>
                <Input placeholder="Jane Doe" autoComplete="name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Phone number
                </label>
                <Input placeholder="e.g. +15551234567" autoComplete="tel" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Preferred date
                </label>
                <Input type="date" />
              </div>

              <Button className="mt-2 h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" type="button">
                <CalendarCheck2 className="mr-2 h-4 w-4" />
                Request booking
              </Button>

              <p className="pt-1 text-center text-xs text-slate-500">
                This is a UI preview. Connect to backend scheduling to confirm bookings.
              </p>
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
