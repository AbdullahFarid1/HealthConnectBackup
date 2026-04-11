"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, AppointmentStatus } from "@/types";

const statusVariant = (s: AppointmentStatus) =>
  s === "confirmed" || s === "pending"
    ? "info"
    : s === "completed"
      ? "success"
      : s === "cancelled"
        ? "destructive"
        : "warning";

export default function ReceptionAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [actioning, setActioning] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doctors = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of appointments) m.set(a.doctorId, a.doctorName);
    return Array.from(m.entries());
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return appointments
      .filter((a) => (doctorFilter ? a.doctorId === doctorFilter : true))
      .filter((a) =>
        q
          ? a.patientName.toLowerCase().includes(q) ||
            a.doctorName.toLowerCase().includes(q) ||
            a.date.includes(q) ||
            a.timeSlot.includes(q)
          : true
      )
      .sort((a, b) => (b.date + b.timeSlot).localeCompare(a.date + a.timeSlot));
  }, [appointments, filter, doctorFilter]);

  const handleCancel = async (id: string) => {
    const reason = prompt("Reason for cancelling? (optional)") ?? "";
    setError("");
    setActioning(id);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "cancel", reason }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Cancel failed.");
      }
      await load();
    } finally {
      setActioning("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All appointments for the doctors you support.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by patient, doctor, date…"
                className="pl-9"
              />
            </div>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All doctors</option>
              {doctors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No matching appointments.
              </p>
            ) : (
              filtered.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {apt.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {apt.doctorName} · {apt.date} {apt.timeSlot} · {apt.clinicName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(apt.status)} className="capitalize">
                      {apt.status}
                    </Badge>
                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        onClick={() => handleCancel(apt.id)}
                        disabled={actioning === apt.id}
                      >
                        {actioning === apt.id && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
