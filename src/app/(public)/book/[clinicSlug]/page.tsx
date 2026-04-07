"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck2,
  ChevronLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserProfileDoc, ClinicDoc } from "@/types";

export default function BookClinicPage() {
  const params = useParams<{ clinicSlug: string }>();
  const doctorId = params.clinicSlug;

  const [doctor, setDoctor] = useState<UserProfileDoc | null>(null);
  const [clinics, setClinics] = useState<ClinicDoc[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const [loggedInRole, setLoggedInRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch doctor + clinics + availability
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/doctors/${doctorId}`);
        if (!res.ok) {
          setDoctor(null);
          return;
        }
        const data = await res.json();
        setDoctor(data.doctor);
        setClinics(data.clinics ?? []);
        // Auto-select if only one clinic
        if (data.clinics?.length === 1) {
          setSelectedClinicId(data.clinics[0].id);
        }
      } catch {
        setDoctor(null);
      } finally {
        setLoadingDoctor(false);
      }
    })();
  }, [doctorId]);

  // Pre-fill from logged-in user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const profile = await res.json();
          if (profile.name) setName(profile.name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.role) setLoggedInRole(profile.role);
        }
      } catch {
        // Not logged in — they'll fill manually
      }
    })();
  }, []);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!date || !doctorId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setTimeSlot("");
    (async () => {
      try {
        const res = await fetch(
          `/api/availability?doctorId=${doctorId}&date=${date}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [date, doctorId]);

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);
  const dashboardPath = (loggedInRole === "doctor" || loggedInRole === "dentist") ? "/o/doctor" : loggedInRole === "patient" ? "/o/patient" : null;

  const getTodayLocal = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedClinicId) {
      setError("Please select a clinic.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    // Frontend validation: reject past dates
    if (date < getTodayLocal()) {
      setError("Cannot book appointments in the past. Please select a future date.");
      return;
    }
    if (!timeSlot) {
      setError("Please select a time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctorId,
          clinicId: selectedClinicId,
          date,
          timeSlot,
          type: "Consultation",
          notes,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setError("You must be logged in to book. Please sign in and try again.");
          return;
        }
        setError(data.error ?? "Failed to book. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-teal-500" />
            <CardContent className="flex flex-col items-center p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                Booking Requested!
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your appointment for <strong>{date}</strong> at{" "}
                <strong>{timeSlot}</strong>
                {selectedClinic && (
                  <>
                    {" "}
                    at <strong>{selectedClinic.name}</strong>
                  </>
                )}{" "}
                has been submitted.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {dashboardPath && (
                  <Link href={dashboardPath}>
                    <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                      My Dashboard
                    </Button>
                  </Link>
                )}
                <Link href={dashboardPath ? `${dashboardPath}/appointments` : "/search"}>
                  <Button variant={dashboardPath ? "outline" : "default"} className="rounded-xl">
                    {dashboardPath ? "My Appointments" : "Search More"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={dashboardPath ? `${dashboardPath}/book` : "/search"}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> {dashboardPath ? "Back to Dashboard" : "Back to search"}
        </Link>
      </div>

      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
          <CardHeader className="pt-6">
            <CardTitle className="text-base">Book an Appointment</CardTitle>
            <CardDescription>
              {loadingDoctor ? (
                "Loading doctor info..."
              ) : doctor ? (
                <>
                  Booking with{" "}
                  <span className="font-semibold text-foreground">
                    {doctor.name}
                  </span>
                  {doctor.specialty && (
                    <span className="text-muted-foreground">
                      {" "}
                      &mdash; {doctor.specialty}
                    </span>
                  )}
                  {doctor.consultationFee && (
                    <span className="text-muted-foreground">
                      {" "}
                      &middot; PKR {doctor.consultationFee.toLocaleString()}
                    </span>
                  )}
                </>
              ) : (
                "Doctor not found."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Full name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Khan"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Phone number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +923001234567"
                autoComplete="tel"
              />
            </div>

            {/* Clinic selection */}
            {clinics.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Select clinic
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Choose a clinic...</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {clinics.length === 1 && (
              <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{clinics[0].name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {clinics[0].city}
                </span>
              </div>
            )}
            {!loadingDoctor && clinics.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                This doctor hasn&apos;t set up any clinics yet.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Preferred date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTodayLocal()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Time slot
              </label>
              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !date ? (
                <p className="py-2 text-xs text-muted-foreground">
                  Select a date to see available slots.
                </p>
              ) : slots.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
                  No slots available for this date. Try another day.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        timeSlot === slot
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Notes{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any symptoms or concerns..."
              />
            </div>

            <Button
              className="mt-1 h-12 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !doctor}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck2 className="mr-2 h-4 w-4" />
              )}
              Request Booking
            </Button>

            <p className="pt-1 text-center text-xs text-muted-foreground">
              You must be logged in to book an appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
