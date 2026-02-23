import {
  BarChart3,
  CalendarCheck2,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  const nav: DashboardNavItem[] = [
    { href: "/o/admin", label: "Overview", icon: BarChart3 },
    { href: "/o/admin/users", label: "Manage Users", icon: Users },
    { href: "/o/admin/appointments", label: "Appointments", icon: CalendarCheck2 },
    { href: "/o/admin/analytics", label: "System Analytics", icon: Shield },
    { href: "/o/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout title="Admin" roleLabel="Admin dashboard" nav={nav}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active users" value="—" />
        <StatCard title="Appointments today" value="—" />
        <StatCard title="System status" value="Healthy" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">Quick actions</p>
            <p className="mt-1 text-sm text-slate-600">
              Manage roles, users, and clinic configuration.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">Audit-ready</p>
            <p className="mt-1 text-sm text-slate-600">
              Clean UI structure for operational reviews and governance.
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
