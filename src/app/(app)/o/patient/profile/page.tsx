"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientProfile() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setCity(data.city ?? "");
        }
      } catch {
        /* empty */
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
        body: JSON.stringify({ name, city }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) setMessage("Profile updated!");
      else setMessage("Failed to save. Please try again.");
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
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal details.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          {message && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {message}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Full name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Phone number
            </label>
            <Input value={phone} disabled placeholder="+923001234567" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              City
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lahore"
            />
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
    </>
  );
}
