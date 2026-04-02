import Link from "next/link";
import { CalendarCheck2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function BookClinicPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href={`/c/${clinicSlug}`} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>
      </div>

      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
          <CardHeader className="pt-6">
            <CardTitle className="text-base">Book an Appointment</CardTitle>
            <CardDescription>
              Booking for <span className="font-semibold text-foreground">{prettySlug(clinicSlug)}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full name</label>
              <Input placeholder="e.g. Ahmed Khan" autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone number</label>
              <Input placeholder="e.g. +923001234567" autoComplete="tel" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Preferred date</label>
              <Input type="date" />
            </div>

            <Button className="mt-1 h-12 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" type="button">
              <CalendarCheck2 className="mr-2 h-4 w-4" /> Request Booking
            </Button>

            <p className="pt-1 text-center text-xs text-muted-foreground">
              UI preview — connect to backend scheduling to confirm bookings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function prettySlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
