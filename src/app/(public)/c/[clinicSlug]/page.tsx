import Link from "next/link";
import { Building2, CalendarCheck2, MapPin, Star, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <Badge variant="secondary" className="mb-3">Clinic / Doctor</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {prettySlug(clinicSlug)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Profile page — add specialties, hours, fees, and reviews when connected to real data.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">About</p>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Lahore, Pakistan</p>
                  <p className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-amber-500" /> 4.7 rating (32 reviews)</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Mon–Sat, 9:00 AM – 8:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Ready to book?</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose a time that works for you.</p>
            <div className="mt-4">
              <Link href={`/book/${clinicSlug}`}>
                <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  <CalendarCheck2 className="mr-2 h-4 w-4" /> Book an Appointment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function prettySlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
