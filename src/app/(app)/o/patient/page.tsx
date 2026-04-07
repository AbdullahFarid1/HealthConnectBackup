"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, Clock, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/types";

const statusVariant = (s: string) =>
  s === "confirmed" || s === "pending"
    ? "info"
    : s === "completed"
      ? "success"
      : s === "cancelled"
        ? "destructive"
        : "secondary";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) setAppointments(await res.json());
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  const completed = appointments.filter((a) => a.status === "completed");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Upcoming"
          value={String(upcoming.length)}
          icon={CalendarCheck2}
        />
        <StatCard
          title="Completed visits"
          value={String(completed.length)}
          icon={Clock}
        />
        <StatCard
          title="Total"
          value={String(appointments.length)}
          icon={FileText}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">
              Recent appointments
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest visits and upcoming schedule.
            </p>
            <div className="mt-4 space-y-2">
              {appointments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No appointments yet. Book your first one!
                </p>
              ) : (
                appointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {apt.doctorName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {apt.type} &middot; {apt.date} &middot; {apt.timeSlot}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant(apt.status)}
                      className="capitalize"
                    >
                      {apt.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">
              Quick actions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump to common tasks.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/o/patient/book">
                <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  Book an appointment
                </Button>
              </Link>
              <Link href="/o/patient/records">
                <Button variant="outline" className="h-11 w-full rounded-xl">
                  View medical records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
