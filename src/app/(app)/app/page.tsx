"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { Shield, Stethoscope, User, Users } from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [status, setStatus] = useState<"checking" | "no-user" | "needs-role">(
    "checking"
  );

  const nav = useMemo<DashboardNavItem[]>(
    () => [
      { href: "/o/patient", label: "Patient", icon: User },
      { href: "/o/dentist", label: "Doctor", icon: Stethoscope },
      { href: "/o/reception", label: "Reception", icon: Users },
      { href: "/o/admin", label: "Admin", icon: Shield },
    ],
    []
  );

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

        if (role === "patient") router.replace("/o/patient");
        else if (role === "doctor" || role === "dentist") router.replace("/o/dentist");
        else if (role === "reception") router.replace("/o/reception");
        else if (role === "admin") router.replace("/o/admin");
        else setStatus("needs-role");
      } catch {
        setStatus("needs-role");
      }
    });

    return () => unsub();
  }, [router]);

  if (status === "no-user") {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-md">
          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
            <CardContent className="p-6">
              <p className="text-sm font-semibold">You’re not logged in.</p>
              <p className="mt-2 text-sm text-slate-600">
                Please login to continue to your dashboard.
              </p>
              <div className="mt-5 flex gap-3">
                <Link href="/login" className="flex-1">
                  <Button className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
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
      </div>
    );
  }

  return (
    <DashboardLayout
      title="App"
      roleLabel={
        status === "checking"
          ? "Checking your session…"
          : "Select a dashboard"
      }
      nav={nav}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Continue to your workspace
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            If your role is configured, you’ll be redirected automatically.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard
            href="/o/patient"
            title="Patient dashboard"
            desc="Book appointments and view records."
          />
          <RoleCard
            href="/o/dentist"
            title="Doctor dashboard"
            desc="Manage appointments and patients."
          />
          <RoleCard
            href="/o/reception"
            title="Reception dashboard"
            desc="Coordinate check-ins and schedules."
          />
          <RoleCard
            href="/o/admin"
            title="Admin dashboard"
            desc="Manage users and system settings."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function RoleCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
