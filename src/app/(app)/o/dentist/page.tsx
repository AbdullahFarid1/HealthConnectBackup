import { BarChart3, ClipboardList, FileText, Stethoscope, UserCircle } from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function DentistDashboard() {
  const nav: DashboardNavItem[] = [
    { href: "/o/dentist", label: "Overview", icon: BarChart3 },
    { href: "/o/dentist/patients", label: "My Patients", icon: Stethoscope },
    { href: "/o/dentist/appointments", label: "Appointments", icon: ClipboardList },
    { href: "/o/dentist/reports", label: "Reports", icon: FileText },
    { href: "/o/dentist/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Doctor" roleLabel="Doctor dashboard" nav={nav}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today’s appointments" value="—" />
        <StatCard title="Patients (this week)" value="—" />
        <StatCard title="Pending reports" value="—" />
      </div>

      <div className="mt-6">
        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">
              Overview
            </p>
            <p className="mt-1 text-sm text-slate-600">
              This dashboard is UI-only for now. Wire it to real data when your backend is ready.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
