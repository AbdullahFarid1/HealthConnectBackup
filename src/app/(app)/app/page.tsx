"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { Shield, Stethoscope, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "patient" | "doctor" | "dentist" | "reception" | "admin";

function normalizeRole(raw: unknown): Role | null {
  const value = typeof raw === "string" ? raw.toLowerCase() : "";
  if (
    value === "patient" ||
    value === "doctor" ||
    value === "dentist" ||
    value === "reception" ||
    value === "admin"
  ) {
    return value;
  }
  return null;
}

export default function AppPortal() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "no-user" | "needs-role">("checking");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("no-user");
        return;
      }
      try {
        const token = await user.getIdTokenResult();
        const role =
          normalizeRole(token.claims.role) ??
          normalizeRole(token.claims.userRole) ??
          normalizeRole(token.claims.type);

        // Receptionists with a pending forced password reset get routed to the
        // reset page instead of their dashboard.
        if (role === "reception") {
          try {
            const res = await fetch("/api/users/me");
            if (res.ok) {
              const data = await res.json();
              if (data.mustResetPassword) {
                router.replace("/auth/reset-password");
                return;
              }
            }
          } catch { /* empty */ }
        }

        if (role === "patient") router.replace("/o/patient");
        else if (role === "doctor" || role === "dentist") router.replace("/o/doctor");
        else if (role === "reception") router.replace("/o/reception");
        else if (role === "admin") router.replace("/o/admin");
        else setStatus("needs-role");
      } catch {
        setStatus("needs-role");
      }
    });
    return () => unsub();
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (status === "no-user") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-foreground">
              You&apos;re not logged in.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please login to continue to your dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/login" className="flex-1">
                <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  Login
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="h-11 w-full rounded-xl">
                  Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">
            Choose your dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If your role is configured, you&apos;ll be redirected automatically.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard href="/o/patient" icon={User} title="Patient" desc="Book appointments and view records." />
          <RoleCard href="/o/doctor" icon={Stethoscope} title="Doctor" desc="Manage appointments and patients." />
          <RoleCard href="/o/reception" icon={Users} title="Reception" desc="Coordinate check-ins and schedules." />
          <RoleCard href="/o/admin" icon={Shield} title="Admin" desc="Manage users and platform settings." />
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof User;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
