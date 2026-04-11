"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, Clock, FileText, Star, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/doctor/RatingStars";
import type { Appointment, UserProfileDoc } from "@/types";

const statusVariant = (s: string) =>
  s === "confirmed" || s === "pending"
    ? "info"
    : s === "completed"
      ? "success"
      : s === "cancelled"
        ? "destructive"
        : "secondary";

interface DoctorGroup {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  visits: number;
  currentRating: number;
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  // Cached specialty lookups by doctorId (not in appointment doc).
  const [doctorMeta, setDoctorMeta] = useState<Record<string, { specialty?: string }>>({});

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

  // Group visited doctors — one entry per unique doctorId with visit count and
  // the current rating (appt.doctorRating is propagated server-side so all
  // visits share the same value).
  const myDoctors = useMemo<DoctorGroup[]>(() => {
    const byDoctor = new Map<string, DoctorGroup>();
    for (const a of completed) {
      const existing = byDoctor.get(a.doctorId);
      if (existing) {
        existing.visits += 1;
        if (typeof a.doctorRating === "number") {
          existing.currentRating = a.doctorRating;
        }
      } else {
        byDoctor.set(a.doctorId, {
          doctorId: a.doctorId,
          doctorName: a.doctorName,
          specialty: doctorMeta[a.doctorId]?.specialty,
          visits: 1,
          currentRating: typeof a.doctorRating === "number" ? a.doctorRating : 0,
        });
      }
    }
    return Array.from(byDoctor.values()).sort((a, b) => b.visits - a.visits);
  }, [completed, doctorMeta]);

  // Fetch specialty for each doctor we don't yet have metadata for.
  useEffect(() => {
    const missing = Array.from(
      new Set(completed.map((a) => a.doctorId).filter((id) => !(id in doctorMeta)))
    );
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const r = await fetch(`/api/doctors/${id}`);
            if (!r.ok) return [id, {}] as const;
            const data = await r.json();
            const doc = data.doctor as UserProfileDoc | undefined;
            return [id, { specialty: doc?.specialty }] as const;
          } catch {
            return [id, {}] as const;
          }
        })
      );
      if (cancelled) return;
      setDoctorMeta((prev) => {
        const next = { ...prev };
        for (const [id, meta] of results) next[id] = meta;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed.length]);

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
                appointments
                  .filter((a) => a.status !== "cancelled")
                  .slice(0, 5)
                  .map((apt) => (
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

      {/* ─── My Doctors ─── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">My Doctors</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Doctors you&apos;ve visited. Your rating is shared across all visits — edit
            it any time and it updates everywhere.
          </p>
          <div className="mt-4 space-y-2">
            {myDoctors.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You haven&apos;t completed any visits yet.
              </p>
            ) : (
              myDoctors.map((d) => (
                <div
                  key={d.doctorId}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {d.doctorName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.specialty ?? "General Practitioner"} &middot;{" "}
                      {d.visits} visit{d.visits === 1 ? "" : "s"}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {d.currentRating > 0 ? (
                        <>
                          <RatingStars value={d.currentRating} size={12} />
                          <span className="font-medium text-foreground">
                            {d.currentRating.toFixed(1)}
                          </span>
                          <span>· your rating</span>
                        </>
                      ) : (
                        <span className="italic">Not rated yet</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/c/${d.doctorId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg"
                      >
                        View
                      </Button>
                    </Link>
                    <Link href="/o/patient/appointments">
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                      >
                        <Star className="mr-1 h-3.5 w-3.5" />
                        {d.currentRating > 0 ? "Edit Rating" : "Rate"}
                      </Button>
                    </Link>
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
