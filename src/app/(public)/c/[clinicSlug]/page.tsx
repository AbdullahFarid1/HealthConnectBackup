"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  Clock,
  Loader2,
  MapPin,
  Star,
  Stethoscope,
  User as UserIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserProfileDoc, ClinicDoc, AvailabilityDoc } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function DoctorDetailPage() {
  const params = useParams<{ clinicSlug: string }>();
  const doctorId = params.clinicSlug;

  const [doctor, setDoctor] = useState<UserProfileDoc | null>(null);
  const [clinics, setClinics] = useState<ClinicDoc[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/doctors/${doctorId}`);
        if (res.ok) {
          const data = await res.json();
          setDoctor(data.doctor);
          setClinics(data.clinics ?? []);
          setAvailability(data.availability ?? []);
        }
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-semibold">Doctor not found</p>
        <Link href="/search">
          <Button variant="outline" className="mt-4 rounded-xl">
            Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {/* Profile picture (clickable → lightbox) */}
        <button
          type="button"
          onClick={() => doctor.photoUrl && setPhotoOpen(true)}
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-28 sm:w-28"
          aria-label="View profile picture"
        >
          {doctor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.photoUrl}
              alt={doctor.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserIcon className="h-10 w-10" />
            </div>
          )}
        </button>

        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Doctor</Badge>
            {!doctor.pmdcRegistrationNo && (
              <Badge variant="outline" className="text-amber-600">
                Unverified
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {doctor.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor.specialty ?? "General Practitioner"}
            {doctor.city && <> &middot; {doctor.city}</>}
          </p>
          {doctor.bio && (
            <p className="mt-3 text-sm text-muted-foreground">{doctor.bio}</p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {photoOpen && doctor.photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPhotoOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPhotoOpen(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doctor.photoUrl}
            alt={doctor.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        {/* About */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">About</p>
                  {doctor.city && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> {doctor.city}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> New (no
                    reviews yet)
                  </p>
                  {doctor.consultationFee && (
                    <p className="font-semibold text-foreground">
                      Consultation Fee: PKR{" "}
                      {doctor.consultationFee.toLocaleString()}
                    </p>
                  )}
                  {doctor.pmdcRegistrationNo && (
                    <p className="text-xs">
                      PMDC: {doctor.pmdcRegistrationNo}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinics */}
          {clinics.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Clinics ({clinics.length})
                  </p>
                </div>
                <div className="space-y-3">
                  {clinics.map((clinic) => {
                    const clinicAvail = availability.filter(
                      (a) => a.clinicId === clinic.id
                    );
                    return (
                      <div
                        key={clinic.id}
                        className="rounded-xl border border-border/60 bg-muted/30 p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {clinic.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {clinic.address},{" "}
                          {clinic.city}
                        </p>
                        {clinicAvail.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {clinicAvail.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {DAY_NAMES[a.dayOfWeek]}{" "}
                                {formatTime(a.startTime)}-
                                {formatTime(a.endTime)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Book CTA */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">
              Ready to book?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a time that works for you.
            </p>
            {doctor.consultationFee && (
              <p className="mt-2 text-lg font-bold text-foreground">
                PKR {doctor.consultationFee.toLocaleString()}
              </p>
            )}
            <div className="mt-4">
              <Link href={`/book/${doctorId}`}>
                <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  <CalendarCheck2 className="mr-2 h-4 w-4" /> Book an
                  Appointment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
