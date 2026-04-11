"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import {
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
} from "firebase/auth";
import Link from "next/link";
import { HeartPulse, Loader2, Mail, Smartphone } from "lucide-react";

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

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

type AuthMethod = "phone" | "email";

function authErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    const map: Record<string, string> = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found for this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential":
        "Invalid email or password. If you use Google-only login, sign in that way.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    if (map[code]) return map[code];
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

async function establishSessionAndRedirect() {
  const idToken = await auth.currentUser!.getIdToken(true);
  await fetch("/api/auth/session", {
    method: "POST",
    body: JSON.stringify({ idToken }),
    headers: { "Content-Type": "application/json" },
  });
  window.location.href = "/app";
}

export default function AuthLoginPage() {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<
    Awaited<ReturnType<typeof signInWithPhoneNumber>> | undefined
  >(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [fromRegister, setFromRegister] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawPhone = params.get("phone");
    if (rawPhone) setPhone(decodeURIComponent(rawPhone));
    if (params.get("from") === "register") setFromRegister(true);
    if (params.get("method") === "email") setMethod("email");
    if (params.get("email")) setEmail(decodeURIComponent(params.get("email")!));
    if (params.get("notice") === "check-email") {
      setMethod("email");
      setInfo("Check your inbox and verify your email. Then sign in below.");
    }
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  };

  const sendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        appVerifier
      );
      setConfirmation(confirmationResult);
    } catch (err: unknown) {
      setError(authErrorMessage(err));
      window.recaptchaVerifier = undefined;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
        headers: { "Content-Type": "application/json" },
      });

      const STORAGE_KEY = "healthconnect_pending_profile";
      const raw = sessionStorage.getItem(STORAGE_KEY);

      if (raw && fromRegister) {
        // Only use pending profile if coming directly from registration flow
        try {
          const pending = JSON.parse(raw);

          // Double-check: only create if the user has no profile yet
          const meRes = await fetch("/api/users/me");
          if (meRes.status === 404) {
            await fetch("/api/users", {
              method: "POST",
              body: JSON.stringify({
                name: pending.name,
                role: pending.accountType,
                phone: pending.phone,
                ...(pending.city ? { city: pending.city } : {}),
                ...(pending.specialty ? { specialty: pending.specialty } : {}),
                ...(pending.pmdcRegistrationNo
                  ? { pmdcRegistrationNo: pending.pmdcRegistrationNo }
                  : {}),
                ...(pending.cnic ? { cnic: pending.cnic } : {}),
              }),
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          // Profile save failed — user can fix via profile page later
        }
      }
      // Always clear to prevent stale data
      sessionStorage.removeItem(STORAGE_KEY);

      window.location.href = "/app";
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      const STORAGE_KEY = "healthconnect_pending_profile";
      const raw = sessionStorage.getItem(STORAGE_KEY);

      // Always create session first
      const idToken = await auth.currentUser!.getIdToken(true);
      await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
        headers: { "Content-Type": "application/json" },
      });

      if (raw && fromRegister) {
        // Only use pending profile if we came directly from the registration flow.
        // This prevents stale sessionStorage from a previous registration from
        // corrupting a different user's login.
        try {
          const pending = JSON.parse(raw);

          // Double-check: only create if the user has no profile yet
          const meRes = await fetch("/api/users/me");
          if (meRes.status === 404) {
            await fetch("/api/users", {
              method: "POST",
              body: JSON.stringify({
                name: pending.name,
                role: pending.accountType,
                email: pending.email,
                ...(pending.city ? { city: pending.city } : {}),
                ...(pending.specialty ? { specialty: pending.specialty } : {}),
                ...(pending.pmdcRegistrationNo
                  ? { pmdcRegistrationNo: pending.pmdcRegistrationNo }
                  : {}),
                ...(pending.cnic ? { cnic: pending.cnic } : {}),
              }),
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          // Profile save failed — can fix via profile page later
        }
      }
      // Always clear pending profile data to prevent stale data affecting future logins
      sessionStorage.removeItem(STORAGE_KEY);

      window.location.href = "/app";
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setError("");
    setResendingEmail(true);
    try {
      if (!auth.currentUser) {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await sendEmailVerification(cred.user);
        await auth.signOut();
        setInfo("Verification email sent. Check your inbox, then sign in again.");
      } else {
        await sendEmailVerification(auth.currentUser);
        setInfo("Verification email sent. Check your inbox.");
      }
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
      <CardHeader className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>
              Choose phone (SMS code) or email and password.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod("phone");
              setError("");
              setInfo("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              method === "phone"
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
              setMethod("email");
              setError("");
              setInfo("");
              setConfirmation(undefined);
              setOtp("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              method === "email"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        {fromRegister && method === "phone" && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Almost there — <strong>verify your phone</strong> below. Tap{" "}
            <em>Send code</em>, then enter the SMS code.
          </div>
        )}
        {fromRegister && method === "email" && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Sign in with the email and password you used to register.
          </div>
        )}

        {info && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {info}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {method === "phone" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Phone number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +923001234567"
                autoComplete="tel"
                disabled={!!confirmation}
              />
            </div>

            {!confirmation ? (
              <Button
                className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                onClick={sendOtp}
                disabled={loading || !phone}
                type="button"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Code
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Verification code
                  </label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <Button
                  className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
                  onClick={verifyOtp}
                  disabled={loading || !otp}
                  type="button"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify &amp; Continue
                </Button>
              </>
            )}

            <div id="recaptcha-container" />
          </>
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
                placeholder="Your password"
                autoComplete="current-password"
                type="password"
              />
            </div>
            <Button
              className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
              onClick={signInWithEmail}
              disabled={loading || !email.trim() || !password}
              type="button"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sign in
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl"
              type="button"
              disabled={resendingEmail || !email.trim() || !password}
              onClick={resendVerificationEmail}
            >
              {resendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Resend verification email
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Uses the same email and password you set during registration.
              Enable <strong>Email/Password</strong> in Firebase Console → Authentication → Sign-in method.
            </p>
          </>
        )}

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Get started
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
