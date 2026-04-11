"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarCheck2, CheckCircle2, Phone, Star, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/doctor/RatingStars";
import type { Appointment } from "@/types";

const statusVariant = (s: string) =>
  s === "confirmed"
    ? "info"
    : s === "in-progress"
      ? "warning"
      : s === "completed"
        ? "success"
        : "secondary";

interface ProfileCompletion {
  percent: number;
  missing: string[];
}

function computeCompletion(profile: Record<string, unknown>, hasClinics: boolean, hasAvailability: boolean): ProfileCompletion {
  const checks: { label: string; ok: boolean }[] = [
    { label: "Full name", ok: !!profile.name },
    { label: "Specialty", ok: !!profile.specialty },
    { label: "PMDC number", ok: !!profile.pmdcRegistrationNo },
    { label: "City", ok: !!profile.city },
    { label: "Consultation fee", ok: !!profile.consultationFee },
    { label: "At least 1 clinic", ok: hasClinics },
    { label: "At least 1 availability slot", ok: hasAvailability },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState<ProfileCompletion>({ percent: 0, missing: [] });
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Fetch appointments, profile, clinics, availability in parallel
        const [apptRes, profileRes, clinicsRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/users/me"),
          fetch("/api/clinics"),
        ]);

        if (apptRes.ok) setAppointments(await apptRes.json());

        let profile: Record<string, unknown> = {};
        let hasClinics = false;
        let hasAvailability = false;

        if (profileRes.ok) {
          profile = await profileRes.json();
          if (typeof profile.ratingAverage === "number") setRatingAverage(profile.ratingAverage);
          if (typeof profile.ratingCount === "number") setRatingCount(profile.ratingCount);
        }
        if (clinicsRes.ok) {
          const clinics = await clinicsRes.json();
          hasClinics = Array.isArray(clinics) && clinics.length > 0;
          // Check availability for first clinic
          if (hasClinics) {
            try {
              const avRes = await fetch(`/api/availability?clinicId=${clinics[0].id}`);
              if (avRes.ok) {
                const av = await avRes.json();
                hasAvailability = Array.isArray(av) && av.length > 0;
              }
            } catch { /* empty */ }
          }
        }

        setCompletion(computeCompletion(profile, hasClinics, hasAvailability));
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (a) => a.date === today && a.status !== "cancelled"
  );
  const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;

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
      {/* Profile completion banner */}
      {completion.percent < 100 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Profile {completion.percent}% complete
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Missing: {completion.missing.join(", ")}
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-800">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
              <Link href="/o/doctor/profile">
                <Button size="sm" className="rounded-xl bg-amber-600 text-white hover:bg-amber-700">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {completion.percent === 100 && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 dark:border-green-500/30 dark:bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Profile complete! You&apos;re all set.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's appointments"
          value={String(todayAppointments.length)}
          icon={CalendarCheck2}
        />
        <StatCard
          title="Total patients"
          value={String(uniquePatients)}
          icon={Users}
        />
        <StatCard
          title="Total appointments"
          value={String(appointments.length)}
          icon={Star}
        />
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Average rating
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ratingCount > 0
                ? `Based on ${ratingCount} verified patient review${ratingCount === 1 ? "" : "s"}.`
                : "No reviews yet. Reviews come in after completed appointments."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RatingStars value={ratingAverage} size={20} />
            <span className="text-lg font-bold text-foreground">
              {ratingCount > 0 ? ratingAverage.toFixed(1) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">
            Today&apos;s Schedule
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming patient appointments for today.
          </p>
          <div className="mt-4 space-y-3">
            {todayAppointments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No appointments scheduled for today.
              </p>
            ) : (
              todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {apt.patientName}
                      {typeof apt.patientAge === "number" && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          · {apt.patientAge} yrs
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apt.timeSlot} &middot; {apt.type}
                    </p>
                    {apt.patientPhone && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {apt.patientPhone}
                      </p>
                    )}
                    {apt.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground italic">
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
