"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/types";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";

const statusVariant = (s: string) =>
  s === "confirmed"
    ? "info"
    : s === "completed"
      ? "success"
      : s === "cancelled"
        ? "destructive"
        : "secondary";

const STATUS_RANK: Record<string, number> = {
  confirmed: 0,
  pending: 1,
  "in-progress": 2,
  completed: 3,
  cancelled: 4,
};
function sortAppointments(list: Appointment[]) {
  return [...list].sort((a, b) => {
    const r = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (r !== 0) return r;
    return b.date.localeCompare(a.date);
  });
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) setAppointments(sortAppointments(await res.json()));
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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
                  className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {apt.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.type} &middot; {apt.date} &middot; {apt.timeSlot}
                      </p>
                      {apt.clinicName && (
                        <p className="text-[11px] text-muted-foreground">{apt.clinicName}</p>
                      )}
                      {apt.notes && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          Notes: {apt.notes}
                        </p>
                      )}
                      {apt.payment && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Escrow: PKR {apt.payment.consultationFee.toLocaleString()} ·{" "}
                          <span className="capitalize">{apt.payment.status}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={statusVariant(apt.status)}
                        className="capitalize"
                      >
                        {apt.status}
                      </Badge>
                      {apt.patientConfirmedCompleted && apt.status !== "completed" && (
                        <span className="text-[10px] text-muted-foreground">Patient confirmed</span>
                      )}
                    </div>
                  </div>
                  <AppointmentActions appt={apt} role="doctor" onChanged={reload} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
