"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import Link from "next/link";
import { HeartPulse, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function OTPLoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ReturnType<typeof signInWithPhoneNumber> extends Promise<infer T> ? T : never>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
      window.recaptchaVerifier = undefined;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    setError("");
    setLoading(true);
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/app";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP";
      setError(message);
    } finally {
      setLoading(false);
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
            <CardTitle className="text-base">Phone Login</CardTitle>
            <CardDescription>
              Enter your phone number to receive a verification code.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

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

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Get started
          </Link>
        </div>

        <div id="recaptcha-container" />
      </CardContent>
    </Card>
  );
}
