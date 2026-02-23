import {
  BarChart3,
  CalendarCheck2,
  MessageSquare,
  Timer,
  UserCircle,
} from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceptionDashboard() {
  const nav: DashboardNavItem[] = [
    { href: "/o/reception", label: "Overview", icon: BarChart3 },
    { href: "/o/reception/queue", label: "Queue", icon: Timer },
    { href: "/o/reception/appointments", label: "Today’s Appointments", icon: CalendarCheck2 },
    { href: "/o/reception/messages", label: "Messages", icon: MessageSquare },
    { href: "/o/reception/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Reception" roleLabel="Reception dashboard" nav={nav}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Checked-in" value="—" />
        <StatCard title="In queue" value="—" />
        <StatCard title="Avg wait" value="—" />
      </div>

      <div className="mt-6">
        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">Today</p>
            <p className="mt-1 text-sm text-slate-600">
              Keep check-ins, scheduling, and updates in one place.
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
