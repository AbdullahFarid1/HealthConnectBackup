"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import Link from "next/link";
import { Shield } from "lucide-react";

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

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  const sendOtp = async () => {
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
    setConfirmation(confirmationResult);
  };

  const verifyOtp = async () => {
    const result = await confirmation.confirm(otp);
    const idToken = await result.user.getIdToken();

    await fetch("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken }),
      headers: { "Content-Type": "application/json" },
    });

    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </span>
            HealthConnect
          </Link>
        </div>

        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your phone number to receive a one-time code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Phone number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +15551234567"
                autoComplete="tel"
              />
            </div>

            <Button
              className="h-11 w-full rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
              onClick={sendOtp}
              type="button"
            >
              Send code
            </Button>

            {confirmation && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Verification code
                  </label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <Button
                  className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  onClick={verifyOtp}
                  type="button"
                >
                  Verify & continue
                </Button>
              </div>
            )}

            <div className="text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold hover:underline">
                Get started
              </Link>
            </div>

            <div id="recaptcha-container" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
