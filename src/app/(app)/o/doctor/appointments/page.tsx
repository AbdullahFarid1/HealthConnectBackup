"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/types";

const statusVariant = (s: string) =>
  s === "confirmed"
    ? "info"
    : s === "completed"
      ? "success"
      : s === "cancelled"
        ? "destructive"
        : "secondary";

export default function DoctorAppointments() {
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

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Appointments
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s and upcoming appointment lists.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No appointments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {apt.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apt.type} &middot; {apt.date} &middot; {apt.timeSlot}
                    </p>
                    {apt.notes && (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        Notes: {apt.notes}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={statusVariant(apt.status)}
                    className="capitalize"
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
