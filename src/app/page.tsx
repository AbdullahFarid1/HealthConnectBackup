import Link from "next/link";
import {
  Activity,
  CalendarCheck2,
  ClipboardList,
  LockKeyhole,
  Shield,
  Stethoscope,
} from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
                <Shield className="h-4 w-4" />
                Role-based access for modern clinics
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Smart Healthcare Made Simple
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Book appointments, manage records, and coordinate care across
                roles—patient, doctor, reception, and admin—within one secure
                workspace.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className="sm:w-auto">
                  <Button className="h-11 w-full rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login" className="sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-full px-6 text-sm font-semibold sm:w-auto"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right-side simple visual card (not dashboard) */}
            <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      HealthConnect
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      A clean, modern care experience
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Built for speed at the front desk and clarity for
                      patients.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-200">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniStat label="Appointments" value="Fast scheduling" />
                  <MiniStat label="Records" value="Secure storage" />
                  <MiniStat label="Dashboards" value="Role-based views" />
                  <MiniStat label="Operations" value="Clear workflows" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-slate-100 bg-white/70 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Features
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Everything you need, nothing you don&apos;t.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-[15px]">
                  A minimal SaaS experience designed for real clinic workflows.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<CalendarCheck2 className="h-5 w-5 text-blue-600" />}
                title="Book Appointments"
                desc="Quick scheduling with a clean patient flow."
              />
              <FeatureCard
                icon={<LockKeyhole className="h-5 w-5 text-teal-600" />}
                title="Secure Medical Records"
                desc="Sensitive data stays protected and organized."
              />
              <FeatureCard
                icon={<Stethoscope className="h-5 w-5 text-slate-900" />}
                title="Doctor Dashboard"
                desc="Appointments, patients, and reports in one view."
              />
              <FeatureCard
                icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
                title="Admin Control Panel"
                desc="Manage users, appointments, and settings."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50/60 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                How it works
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                A simple 3-step flow.
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">
                Clear structure for every role—from discovery to follow-up.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
              <StepCard
                icon={<CalendarCheck2 className="h-5 w-5 text-blue-600" />}
                title="Choose a time"
                desc="Patients find availability and request a slot."
              />
              <StepCard
                icon={<ClipboardList className="h-5 w-5 text-teal-600" />}
                title="Check in & manage"
                desc="Reception coordinates arrivals and schedules."
              />
              <StepCard
                icon={<Stethoscope className="h-5 w-5 text-slate-900" />}
                title="Treat & follow up"
                desc="Doctors review context and continue care."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-blue-600 to-teal-500 px-6 py-10 text-white shadow-xl shadow-blue-200 sm:px-10">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h3 className="text-xl font-semibold tracking-tight">
                    Ready to try HealthConnect?
                  </h3>
                  <p className="mt-2 text-sm text-white/85">
                    Start with a clean, role-based experience and grow from
                    there.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button className="h-11 w-full rounded-full bg-white px-6 font-semibold text-slate-900 hover:bg-white/90 sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/search" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-full border-white/40 bg-transparent px-6 font-semibold text-white hover:bg-white/10 sm:w-auto"
                    >
                      Search
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
