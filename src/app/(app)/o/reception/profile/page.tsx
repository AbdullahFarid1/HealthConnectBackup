"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DoctorInviteState, ReceptionistPermissions } from "@/types";

interface InviteRow {
  doctorId: string;
  doctorName: string;
  specialty: string;
  state: DoctorInviteState;
  permissions?: ReceptionistPermissions;
}

const PERM_LABELS: Array<[keyof ReceptionistPermissions, string]> = [
  ["cancel", "Cancel appointments"],
  ["reschedule", "Reschedule appointments"],
  ["viewPatientDetails", "View patient details"],
  ["manageQueue", "Manage queue"],
  ["markCompletion", "Mark completion"],
];

export default function ReceptionProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [meRes, invRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/receptionists/me/invites"),
        ]);
        if (meRes.ok) {
          const data = await meRes.json();
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setPhone(data.phone ?? "");
        }
        if (invRes.ok) setInvites(await invRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ name, phone }),
        headers: { "Content-Type": "application/json" },
      });
      setMessage(res.ok ? "Profile updated!" : "Failed to save.");
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your account and doctor assignments.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {message && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {message}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email</label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Phone number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+923001234567" />
          </div>
          <Button
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">My doctors</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Each doctor can independently set what you can do in their practice.
          </p>
          <div className="mt-4 space-y-3">
            {invites.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You are not linked to any doctors yet.
              </p>
            ) : (
              invites.map((inv) => {
                const variant =
                  inv.state.status === "active" || inv.state.status === "accepted"
                    ? "success"
                    : inv.state.status === "rejected" || inv.state.status === "expired"
                      ? "destructive"
                      : "warning";
                return (
                  <div
                    key={inv.doctorId}
                    className="rounded-xl border border-border/60 bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{inv.doctorName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {inv.specialty || "Doctor"}
                        </p>
                      </div>
                      <Badge variant={variant} className="capitalize text-[10px]">
                        {inv.state.status}
                      </Badge>
                    </div>
                    {inv.permissions && (
                      <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        {PERM_LABELS.map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                inv.permissions?.[key] ? "bg-emerald-500" : "bg-border"
                              }`}
                            />
                            <span className={inv.permissions?.[key] ? "text-foreground" : ""}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
