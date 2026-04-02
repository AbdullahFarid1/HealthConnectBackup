"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail, Smartphone, Stethoscope, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AccountType = "patient" | "doctor" | null;
type VerifyBy = "phone" | "email";

const STORAGE_KEY = "healthconnect_pending_profile";

function normalizePhone(raw: string) {
  return raw.replace(/\s/g, "").trim();
}

function isValidE164ish(phone: string) {
  return /^\+[1-9]\d{8,14}$/.test(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function firebaseRegisterError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    const map: Record<string, string> = {
      "auth/email-already-in-use":
        "This email is already registered. Sign in instead.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password is too weak. Use at least 6 characters.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    if (map[code]) return map[code];
  }
  if (err instanceof Error) return err.message;
  return "Could not create your account. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [verifyBy, setVerifyBy] = useState<VerifyBy>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [pmdc, setPmdc] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneContinue = () => {
    setFormError("");
    const trimmedName = name.trim();
    const trimmedPhone = normalizePhone(phone);

    if (trimmedName.length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!isValidE164ish(trimmedPhone)) {
      setFormError(
        "Enter a valid phone number in international format (e.g. +923001234567)."
      );
      return;
    }
    if (accountType === "doctor") {
      if (!pmdc.trim()) {
        setFormError("Please enter your PMDC registration number.");
        return;
      }
      if (!specialty.trim()) {
        setFormError("Please enter your primary specialty.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        accountType: accountType!,
        verificationMethod: "phone" as const,
        name: trimmedName,
        phone: trimmedPhone,
        ...(accountType === "patient" && city.trim()
          ? { city: city.trim() }
          : {}),
        ...(accountType === "doctor"
          ? {
              pmdcRegistrationNo: pmdc.trim(),
              specialty: specialty.trim(),
            }
          : {}),
        savedAt: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setFormError("Could not save your details. Check browser storage settings.");
      setSubmitting(false);
      return;
    }

    const q = new URLSearchParams({
      from: "register",
      phone: trimmedPhone,
      method: "phone",
    });
    router.push(`/auth/login?${q.toString()}`);
    setSubmitting(false);
  };

  const handleEmailRegister = async () => {
    setFormError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (accountType === "doctor") {
      if (!pmdc.trim()) {
        setFormError("Please enter your PMDC registration number.");
        return;
      }
      if (!specialty.trim()) {
        setFormError("Please enter your primary specialty.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        accountType: accountType!,
        verificationMethod: "email" as const,
        name: trimmedName,
        email: trimmedEmail,
        ...(accountType === "patient" && city.trim()
          ? { city: city.trim() }
          : {}),
        ...(accountType === "doctor"
          ? {
              pmdcRegistrationNo: pmdc.trim(),
              specialty: specialty.trim(),
            }
          : {}),
        savedAt: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      const cred = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      await updateProfile(cred.user, { displayName: trimmedName });
      await sendEmailVerification(cred.user);

      const idToken = await cred.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/app";
    } catch (err: unknown) {
      setFormError(firebaseRegisterError(err));
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (verifyBy === "phone") handlePhoneContinue();
    else void handleEmailRegister();
  };

  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-teal-500 to-blue-600" />
      <CardHeader className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Create your account</CardTitle>
            <CardDescription>
              Join HealthConnect as a patient or doctor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {!accountType ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType("patient")}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border p-5 text-center transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
            >
              <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-foreground">
                Patient
              </span>
              <span className="text-[11px] text-muted-foreground">
                Book appointments
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("doctor")}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border p-5 text-center transition-all hover:border-teal-300 hover:bg-teal-50/50 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/5"
            >
              <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold text-foreground">
                Doctor
              </span>
              <span className="text-[11px] text-muted-foreground">
                List your practice
              </span>
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setAccountType(null);
                setFormError("");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              &larr; Change account type
            </button>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => {
                  setVerifyBy("phone");
                  setFormError("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                  verifyBy === "phone"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-4 w-4" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyBy("email");
                  setFormError("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                  verifyBy === "email"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            <div className="space-y-3">
              {formError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

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

              {verifyBy === "phone" ? (
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
                  <p className="text-[11px] text-muted-foreground">
                    Use country code with +. You&apos;ll verify via SMS on the
                    next step.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Password
                    </label>
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      type="password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Confirm password
                    </label>
                    <Input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      type="password"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    We&apos;ll send a verification link to your email. Enable{" "}
                    <strong>Email/Password</strong> in Firebase Console →
                    Authentication → Sign-in method.
                  </p>
                </>
              )}

              {accountType === "patient" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    City{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your city or region"
                  />
                </div>
              )}
              {accountType === "doctor" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      PMDC Registration No.
                    </label>
                    <Input
                      value={pmdc}
                      onChange={(e) => setPmdc(e.target.value)}
                      placeholder="e.g. 12345-P"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Primary Specialty
                    </label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology, Dermatology"
                    />
                  </div>
                </>
              )}
            </div>

            <Button
              className="mt-1 h-12 w-full rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20 hover:bg-teal-700"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {verifyBy === "phone"
                ? "Continue to phone verification"
                : "Create account & verify email"}
            </Button>
          </>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
