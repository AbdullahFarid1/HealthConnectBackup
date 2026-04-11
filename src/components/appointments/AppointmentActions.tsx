"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  X,
  CalendarClock,
  CheckCircle2,
  Star,
  Receipt,
  PhoneCall,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Appointment } from "@/types";
import {
  canDoctorModify,
  canPatientModify,
  appointmentEnd,
  appointmentStart,
  DEFAULT_SLOT_DURATION_MINUTES,
  generateDoctorRescheduleSlots,
  todayInAppTz,
} from "@/lib/policy";
import { computeRefund, formatPKR } from "@/lib/fees";

type Role = "patient" | "doctor";

export function AppointmentActions({
  appt,
  role,
  onChanged,
}: {
  appt: Appointment;
  role: Role;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reschedReason, setReschedReason] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  // Doctor reschedule day view: existing appointments on the chosen day.
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [showCommReminder, setShowCommReminder] = useState(false);

  const [rateOpen, setRateOpen] = useState(false);
  const [doctorRating, setDoctorRating] = useState(5);
  const [platformRating, setPlatformRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const [receiptOpen, setReceiptOpen] = useState(false);

  const policy = useMemo(() => {
    if (appt.status === "cancelled" || appt.status === "completed") {
      return { allowed: false, reason: `Appointment is ${appt.status}.` };
    }
    try {
      return role === "doctor"
        ? canDoctorModify(appt.date, appt.timeSlot)
        : canPatientModify(appt.date, appt.timeSlot, appt.createdAt);
    } catch {
      return { allowed: false, reason: "Unable to evaluate cancellation policy." };
    }
  }, [appt, role]);

  const refundAmount = appt.payment ? computeRefund(appt.payment) : 0;
  const todayStr = useMemo(() => {
    try {
      return todayInAppTz();
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  // Determine whether a slot is in the past for the chosen date.
  const isSlotPast = useCallback(
    (date: string, slot: string) => {
      try {
        return appointmentStart(date, slot).getTime() <= Date.now();
      } catch {
        return false;
      }
    },
    []
  );

  // Booked slots on the doctor's calendar for the selected day.
  const bookedSlots = useMemo(
    () =>
      new Set(
        dayAppointments
          .filter((a) => a.id !== appt.id && a.status !== "cancelled")
          .map((a) => a.timeSlot)
      ),
    [dayAppointments, appt.id]
  );

  const fetchSlots = useCallback(
    async (date: string) => {
      if (!date) return;
      setSlotsLoading(true);
      try {
        if (role === "doctor") {
          // Doctor reschedule: full 8 AM – 11 PM grid; conflicts/past handled in UI.
          setSlots(generateDoctorRescheduleSlots());
          // Fetch existing appointments on that day for context + overlap check.
          try {
            const res = await fetch("/api/appointments");
            if (res.ok) {
              const all: Appointment[] = await res.json();
              setDayAppointments(all.filter((a) => a.date === date));
            } else {
              setDayAppointments([]);
            }
          } catch {
            setDayAppointments([]);
          }
        } else {
          const res = await fetch(`/api/availability?doctorId=${appt.doctorId}&date=${date}`);
          if (res.ok) {
            const data = await res.json();
            setSlots(data.slots ?? []);
          } else {
            setSlots([]);
          }
          setDayAppointments([]);
        }
      } catch {
        setSlots([]);
        setDayAppointments([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [role, appt.doctorId]
  );

  // Reset day-view state when modal closes.
  useEffect(() => {
    if (!rescheduleOpen) {
      setDayAppointments([]);
      setSlots([]);
    }
  }, [rescheduleOpen]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appt.id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return null;
      }
      return data;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    const data = await post({ action: "cancel", reason: cancelReason });
    if (!data) return;
    setInfo(
      `Cancellation accepted. Refund of ${formatPKR(data.refundAmount ?? 0)} will be processed within 24 hours (simulated). The 2% platform fee is retained.`
    );
    setCancelOpen(false);
    onChanged();
  };

  const doReschedule = async () => {
    const data = await post({
      action: "reschedule",
      newDate,
      newTimeSlot: newTime,
      reason: reschedReason,
    });
    if (!data) return;
    if (role === "doctor") {
      setShowCommReminder(true);
      setInfo(
        "Appointment rescheduled. The patient has been notified and must confirm or cancel — please contact them directly to confirm the new time."
      );
    } else {
      setInfo("Appointment rescheduled. The other party has been notified (simulated).");
    }
    setRescheduleOpen(false);
    setNewDate("");
    setNewTime("");
    setReschedReason("");
    onChanged();
  };

  const doPatientConfirmReschedule = async () => {
    const data = await post({ action: "patient-confirm-reschedule" });
    if (!data) return;
    setInfo("Reschedule confirmed. See you at the new time!");
    onChanged();
  };

  const doPatientRejectReschedule = async () => {
    const data = await post({
      action: "patient-reject-reschedule",
      reason: "Rejected the rescheduled time.",
    });
    if (!data) return;
    setInfo(
      `Appointment cancelled. Refund of ${formatPKR(data.refundAmount ?? 0)} will be processed within 24 hours (simulated).`
    );
    onChanged();
  };

  const doDoctorConfirm = async () => {
    const data = await post({ action: "doctor-confirm-complete" });
    if (!data) return;
    setInfo(
      data.completed
        ? "Visit completed. Consultation fee released to you (simulated). HealthConnect retains the 2% platform fee."
        : "Marked as completed on your side. Waiting for the patient to confirm before payout."
    );
    onChanged();
  };

  const doPatientConfirm = async () => {
    const data = await post({ action: "patient-confirm-complete" });
    if (!data) return;
    setInfo(
      data.completed
        ? "Visit confirmed. The doctor has been paid out (simulated). You can now leave a rating."
        : "Marked as completed on your side. Waiting for the doctor to confirm."
    );
    onChanged();
  };

  const doRate = async () => {
    const data = await post({
      action: "rate",
      doctorRating,
      platformRating,
      feedback,
    });
    if (!data) return;
    setInfo("Thanks for your feedback!");
    setRateOpen(false);
    onChanged();
  };

  const isFinal = appt.status === "cancelled" || appt.status === "completed";
  // Patients can rate after the appointment is completed and can also edit
  // their previous rating at any time (reviews are keyed per patient+doctor,
  // so editing overwrites the previous review).
  const showRate = role === "patient" && appt.status === "completed";
  const hasExistingRating = appt.doctorRating !== undefined;
  const showReceipt = appt.status === "completed";

  // Pre-fill rating modal from the existing rating when the patient reopens it.
  useEffect(() => {
    if (rateOpen && hasExistingRating) {
      setDoctorRating(appt.doctorRating ?? 5);
      setPlatformRating(appt.platformRating ?? 5);
      setFeedback(appt.feedback ?? "");
    }
  }, [rateOpen, hasExistingRating, appt.doctorRating, appt.platformRating, appt.feedback]);

  // Mark Complete is only visible after the slot END time has passed.
  const slotEnded = useMemo(() => {
    try {
      const end = appointmentEnd(
        appt.date,
        appt.timeSlot,
        appt.slotDuration ?? DEFAULT_SLOT_DURATION_MINUTES
      );
      return Date.now() >= end.getTime();
    } catch {
      return false;
    }
  }, [appt.date, appt.timeSlot, appt.slotDuration]);

  return (
    <div className="mt-2 space-y-2">
      {info && (
        <Banner kind="success" message={info} onClose={() => setInfo("")} />
      )}
      {error && (
        <Banner kind="error" message={error} onClose={() => setError("")} />
      )}

      {/* Doctor: post-reschedule communication reminder */}
      {role === "doctor" && showCommReminder && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <PhoneCall className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Contact the patient</p>
              <p className="mt-0.5">
                Please call or message {appt.patientName} to confirm the new time. The patient must
                confirm the reschedule on their dashboard, otherwise it auto-confirms after 6 hours
                or 1 hour before the appointment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCommReminder(false)}
              className="text-xs font-semibold underline"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Patient: pending reschedule confirmation banner */}
      {role === "patient" && appt.pendingPatientConfirmation && !isFinal && (
        <div className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Doctor proposed a new time</p>
              <p className="mt-0.5">
                {appt.doctorName} rescheduled your appointment to {appt.date} at {appt.timeSlot}.
                Please confirm or cancel. Auto-confirms after 6 hours or 1 hour before the
                appointment, whichever comes first.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="h-7 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  disabled={busy}
                  onClick={doPatientConfirmReschedule}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg"
                  disabled={busy}
                  onClick={doPatientRejectReschedule}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Cancel & refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!isFinal && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              disabled={busy || !policy.allowed}
              title={policy.allowed ? undefined : policy.reason}
              onClick={() => setCancelOpen(true)}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              disabled={busy || !policy.allowed}
              title={policy.allowed ? undefined : policy.reason}
              onClick={() => setRescheduleOpen(true)}
            >
              <CalendarClock className="mr-1 h-3.5 w-3.5" /> Reschedule
            </Button>
          </>
        )}

        {/* Completion confirmations — only visible after the slot end time. */}
        {!isFinal && slotEnded && role === "doctor" && !appt.doctorConfirmedCompleted && (
          <Button
            size="sm"
            className="h-8 rounded-lg bg-green-600 text-white hover:bg-green-700"
            disabled={busy}
            onClick={doDoctorConfirm}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Visit Completed
          </Button>
        )}
        {!isFinal && slotEnded && role === "patient" && !appt.patientConfirmedCompleted && (
          <Button
            size="sm"
            className="h-8 rounded-lg bg-green-600 text-white hover:bg-green-700"
            disabled={busy}
            onClick={doPatientConfirm}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm Visit Completed
          </Button>
        )}
        {!isFinal && !slotEnded && (
          <span className="text-[11px] italic text-muted-foreground self-center">
            Mark complete becomes available after the slot ends.
          </span>
        )}

        {showRate && (
          <Button
            size="sm"
            className="h-8 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => setRateOpen(true)}
          >
            <Star className="mr-1 h-3.5 w-3.5" />{" "}
            {hasExistingRating ? "Edit Rating" : "Rate"}
          </Button>
        )}
        {showReceipt && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg"
            onClick={() => setReceiptOpen(true)}
          >
            <Receipt className="mr-1 h-3.5 w-3.5" /> Receipt
          </Button>
        )}
      </div>

      {!isFinal && !policy.allowed && (
        <p className="text-[11px] text-muted-foreground italic">
          Note: {policy.reason}
        </p>
      )}

      {/* ─── Cancel modal ─── */}
      {cancelOpen && (
        <Modal title="Cancel appointment" onClose={() => setCancelOpen(false)}>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel? You will be refunded{" "}
            <strong className="text-foreground">{formatPKR(refundAmount)}</strong>{" "}
            within 24 hours (simulated). HealthConnect keeps the 2% platform fee.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Reason (optional)</label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Got better, can't make it..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCancelOpen(false)}>
              Keep
            </Button>
            <Button
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={doCancel}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancel
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── Reschedule modal ─── */}
      {rescheduleOpen && (
        <Modal title="Reschedule appointment" onClose={() => setRescheduleOpen(false)}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">New date</label>
            <Input
              type="date"
              min={todayStr}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewTime("");
                fetchSlots(e.target.value);
              }}
            />
            {role === "doctor" && (
              <p className="text-[11px] text-muted-foreground">
                You can reschedule into any 30-minute slot between 8:00 AM and 11:00 PM.
              </p>
            )}
          </div>

          {/* Doctor: existing appointments on selected day for context */}
          {role === "doctor" && newDate && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Your appointments on {newDate}
              </label>
              {dayAppointments.filter((a) => a.status !== "cancelled").length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-2 py-2 text-[11px] text-muted-foreground">
                  No other appointments on this day.
                </p>
              ) : (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
                  {dayAppointments
                    .filter((a) => a.status !== "cancelled")
                    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                    .map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] ${
                          a.id === appt.id ? "bg-blue-50 dark:bg-blue-500/10" : "bg-muted/40"
                        }`}
                      >
                        <span className="font-medium text-foreground">{a.timeSlot}</span>
                        <span className="truncate text-muted-foreground">
                          {a.id === appt.id ? "(this appointment)" : a.patientName}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">New time slot</label>
            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !newDate ? (
              <p className="text-xs text-muted-foreground">Pick a date first.</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-muted-foreground">No available slots on that date.</p>
            ) : (
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {slots.map((s) => {
                  const past = isSlotPast(newDate, s);
                  const booked = bookedSlots.has(s);
                  const disabled = past || booked;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      title={
                        past
                          ? "This time is in the past"
                          : booked
                            ? "You already have an appointment at this time"
                            : undefined
                      }
                      onClick={() => setNewTime(s)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        newTime === s
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : disabled
                            ? "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50 line-through"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Reason</label>
            <Input
              value={reschedReason}
              onChange={(e) => setReschedReason(e.target.value)}
              placeholder="Why are you rescheduling?"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              disabled={busy || !newDate || !newTime}
              onClick={doReschedule}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reschedule
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── Rate modal ─── */}
      {rateOpen && (
        <Modal title="Rate your experience" onClose={() => setRateOpen(false)}>
          <RatingRow label="Rate the doctor" value={doctorRating} onChange={setDoctorRating} />
          <RatingRow label="Rate HealthConnect" value={platformRating} onChange={setPlatformRating} />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Feedback (optional)</label>
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What went well? What could be better?"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRateOpen(false)}>
              Skip
            </Button>
            <Button
              className="flex-1 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
              disabled={busy}
              onClick={doRate}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── Receipt modal ─── */}
      {receiptOpen && appt.payment && (
        <Modal title="Receipt" onClose={() => setReceiptOpen(false)}>
          <div className="space-y-1.5 text-sm">
            <Row label="Appointment" value={`${appt.date} · ${appt.timeSlot}`} />
            <Row label="Doctor" value={appt.doctorName} />
            <Row label="Patient" value={appt.patientName} />
            <Row label="Clinic" value={appt.clinicName} />
            <div className="my-2 border-t border-border/60" />
            <Row label="Consultation fee" value={formatPKR(appt.payment.consultationFee)} />
            <Row label="Platform fee (2%)" value={formatPKR(appt.payment.platformFee)} />
            <Row label="Tax (5%)" value={formatPKR(appt.payment.tax)} />
            <Row label="Total paid" value={formatPKR(appt.payment.total)} bold />
            <Row
              label="Payout status"
              value={appt.payment.status === "released" ? "Released to doctor" : appt.payment.status}
            />
          </div>
          <p className="text-[11px] italic text-muted-foreground">
            Receipt generated by HealthConnect (simulated). A copy would normally be emailed to both parties.
          </p>
          <Button className="w-full rounded-xl" onClick={() => setReceiptOpen(false)}>
            Close
          </Button>
        </Modal>
      )}
    </div>
  );
}

function Banner({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const cls =
    kind === "success"
      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
      : "border-destructive/30 bg-destructive/10 text-destructive";
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${cls}`}>
      <div className="flex items-start justify-between gap-2">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="text-xs font-semibold underline">
          OK
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="text-2xl"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 ${
                n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
