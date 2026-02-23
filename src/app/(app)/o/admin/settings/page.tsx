import {
  BarChart3,
  CalendarCheck2,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import {
  DashboardLayout,
  type DashboardNavItem,
} from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const nav: DashboardNavItem[] = [
    { href: "/o/admin", label: "Overview", icon: BarChart3 },
    { href: "/o/admin/users", label: "Manage Users", icon: Users },
    { href: "/o/admin/appointments", label: "Appointments", icon: CalendarCheck2 },
    { href: "/o/admin/analytics", label: "System Analytics", icon: Shield },
    { href: "/o/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout title="Settings" roleLabel="Admin dashboard" nav={nav}>
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900">System settings</p>
          <p className="mt-1 text-sm text-slate-600">
            Configure clinic settings, permissions, and policies here (UI-only).
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

