"use client";

import Link from "next/link";
import { useState } from "react";
import { Stethoscope, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccountType = "patient" | "doctor" | null;

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>(null);

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
        {/* Account type selector */}
        {!accountType ? (
          <div className="grid grid-cols-2 gap-3">
            <button
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
              onClick={() => setAccountType(null)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              &larr; Change account type
            </button>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Full name
                </label>
                <Input placeholder="e.g. Ahmed Khan" autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Phone number
                </label>
                <Input placeholder="e.g. +923001234567" autoComplete="tel" />
              </div>
              {accountType === "patient" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    City
                  </label>
                  <Input placeholder="e.g. Lahore" />
                </div>
              )}
              {accountType === "doctor" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      PMDC Registration No.
                    </label>
                    <Input placeholder="e.g. 12345-P" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Primary Specialty
                    </label>
                    <Input placeholder="e.g. Cardiologist, Dermatologist" />
                  </div>
                </>
              )}
            </div>

            <Button
              className="mt-1 h-12 w-full rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20 hover:bg-teal-700"
              type="button"
            >
              Create Account
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
