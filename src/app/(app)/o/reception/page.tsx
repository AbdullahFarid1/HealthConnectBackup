"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock, Loader2, Stethoscope, Timer, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, DoctorInviteState, ReceptionistPermissions } from "@/types";

interface InviteRow {
  doctorId: string;
  doctorName: string;
  specialty: string;
  state: DoctorInviteState;
  permissions?: ReceptionistPermissions;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function checkInVariant(s?: string) {
  if (s === "arrived") return "info";
  if (s === "in-progress") return "warning";
  if (s === "done") return "success";
  return "secondary";
}

export default function ReceptionOverview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string>("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [aRes, iRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/receptionists/me/invites"),
      ]);
      if (aRes.ok) setAppointments(await aRes.json());
      if (iRes.ok) setInvites(await iRes.json());
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeInvites = invites.filter(
    (i) => i.state.status === "accepted" || i.state.status === "active"
  );
  const pendingInvites = invites.filter((i) => i.state.status === "invited");

  const today = todayKey();
  const todays = useMemo(
    () =>
      appointments
        .filter((a) => a.date === today && a.status !== "cancelled")
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    [appointments, today]
  );

  const checkedIn = todays.filter((a) => a.checkInStatus === "arrived" || a.checkInStatus === "in-progress").length;
  const inQueue = todays.filter((a) => !a.checkInStatus || a.checkInStatus === "waiting").length;
  const completed = todays.filter((a) => a.checkInStatus === "done" || a.status === "completed").length;

  const handleInviteAction = async (doctorId: string, action: "accept" | "reject") => {
    setError("");
    setActioning(`invite-${doctorId}-${action}`);
    try {
      const res = await fetch("/api/receptionists/me/invites", {
        method: "POST",
        body: JSON.stringify({ doctorId, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update invite.");
      }
      await load();
    } finally {
      setActioning("");
    }
  };

  const handleCheckIn = async (
    appt: Appointment,
    action: "mark-arrived" | "mark-in-progress" | "mark-done" | "mark-complete"
  ) => {
    setError("");
    setActioning(`${appt.id}-${action}`);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        body: JSON.stringify({ id: appt.id, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed.");
      }
      await load();
    } finally {
      setActioning("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Pending invites</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A doctor has invited you to their practice. Accept to start managing their schedule.
            </p>
            <div className="mt-3 space-y-2">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.doctorId}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{inv.doctorName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {inv.specialty || "Doctor"} · expires {new Date(inv.state.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => handleInviteAction(inv.doctorId, "accept")}
                      disabled={actioning === `invite-${inv.doctorId}-accept`}
                    >
                      {actioning === `invite-${inv.doctorId}-accept` && (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      )}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      onClick={() => handleInviteAction(inv.doctorId, "reject")}
                      disabled={actioning === `invite-${inv.doctorId}-reject`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's queue" value={String(inQueue)} icon={Users} />
        <StatCard title="Checked in" value={String(checkedIn)} icon={Timer} />
        <StatCard title="Completed" value={String(completed)} icon={Clock} />
      </div>

      {/* Linked doctors */}
      {activeInvites.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">My doctors</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeInvites.map((inv) => (
                <Badge key={inv.doctorId} variant="outline" className="text-xs">
                  {inv.doctorName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's queue */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Today&apos;s queue</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Check patients in, start consultations, and close out visits.
          </p>
          <div className="mt-4 space-y-2">
            {todays.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No appointments scheduled for today.
              </p>
            ) : (
              todays.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {apt.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {apt.timeSlot} · {apt.doctorName} · {apt.clinicName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={checkInVariant(apt.checkInStatus)} className="capitalize">
                      {apt.checkInStatus ?? "waiting"}
                    </Badge>
                    {(!apt.checkInStatus || apt.checkInStatus === "waiting") && (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg"
                        onClick={() => handleCheckIn(apt, "mark-arrived")}
                        disabled={actioning === `${apt.id}-mark-arrived`}
                      >
                        Arrived
                      </Button>
                    )}
                    {apt.checkInStatus === "arrived" && (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg"
                        onClick={() => handleCheckIn(apt, "mark-in-progress")}
                        disabled={actioning === `${apt.id}-mark-in-progress`}
                      >
                        Start
                      </Button>
                    )}
                    {apt.checkInStatus === "in-progress" && (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg"
                        onClick={() => handleCheckIn(apt, "mark-done")}
                        disabled={actioning === `${apt.id}-mark-done`}
                      >
                        Done
                      </Button>
                    )}
                    {apt.status !== "completed" && apt.checkInStatus === "done" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        onClick={() => handleCheckIn(apt, "mark-complete")}
                        disabled={actioning === `${apt.id}-mark-complete`}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <Link href="/o/reception/appointments">
              <Button variant="outline" className="h-10 rounded-xl">
                View all appointments
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
