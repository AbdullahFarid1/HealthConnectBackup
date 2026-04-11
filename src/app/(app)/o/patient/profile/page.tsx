"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, User as UserIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Gender = "" | "male" | "female" | "other";

function ageFromDob(dob: string): number | "" {
  if (!dob) return "";
  const d = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
  return years >= 0 ? years : "";
}

export default function PatientProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<Gender>("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoMessageKind, setPhotoMessageKind] =
    useState<"info" | "success" | "error">("info");
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
          setEmail(data.email ?? "");
          setPhone(data.phone ?? "");
          setCity(data.city ?? "");
          setDob(data.dob ?? "");
          setAge(
            typeof data.age === "number"
              ? data.age
              : data.dob
                ? ageFromDob(data.dob)
                : ""
          );
          setGender((data.gender as Gender) ?? "");
          setPhotoUrl(data.photoUrl ?? "");
        }
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keep age synced with DOB when DOB changes and user hasn't manually set age.
  useEffect(() => {
    if (!dob) return;
    const derived = ageFromDob(dob);
    if (derived !== "") setAge(derived);
  }, [dob]);

  // ─── Profile picture (simulated upload) ────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setPhotoMessageKind("error");
      setPhotoMessage("Invalid file type. Please choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setPhotoMessageKind("info");
    setPhotoMessage("Uploading image… (simulated — Firebase Storage is not yet wired up)");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setPhotoUrl(dataUrl);
      setPhotoMessageKind("success");
      setPhotoMessage(
        "Profile picture updated. (Simulated upload — click Save Changes to persist.)"
      );
    };
    reader.onerror = () => {
      setPhotoMessageKind("error");
      setPhotoMessage("Unable to store image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoMessageKind("info");
    setPhotoMessage("Profile picture removed. Click Save Changes to persist.");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          dob: dob || "",
          age: age === "" ? "" : Number(age),
          gender,
          photoUrl,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) setMessage("Profile updated!");
      else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to save. Please try again.");
      }
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

  const photoBannerClass =
    photoMessageKind === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : photoMessageKind === "success"
        ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
        : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";

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

          {/* Profile picture */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Profile picture{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Profile preview"
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Attach Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
                {photoUrl && (
                  <Button
                    variant="outline"
                    type="button"
                    className="h-10 rounded-xl"
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {photoMessage && (
              <p
                className={`rounded-xl border px-3 py-2 text-[11px] ${photoBannerClass}`}
              >
                {photoMessage}
              </p>
            )}
          </div>

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
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Phone number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+923001234567"
              autoComplete="tel"
            />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Date of birth
              </label>
              <Input
                type="date"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Age{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                type="number"
                min={0}
                max={120}
                value={age === "" ? "" : String(age)}
                onChange={(e) => {
                  const v = e.target.value;
                  setAge(v === "" ? "" : Number(v));
                }}
                placeholder="e.g. 29"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
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
