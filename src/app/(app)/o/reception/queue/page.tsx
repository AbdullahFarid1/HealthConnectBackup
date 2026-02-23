import {
  BarChart3,
  CalendarCheck2,
  MessageSquare,
  Timer,
  UserCircle,
} from "lucide-react";

import {
  DashboardLayout,
  type DashboardNavItem,
} from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceptionQueuePage() {
  const nav: DashboardNavItem[] = [
    { href: "/o/reception", label: "Overview", icon: BarChart3 },
    { href: "/o/reception/queue", label: "Queue", icon: Timer },
    { href: "/o/reception/appointments", label: "Today’s Appointments", icon: CalendarCheck2 },
    { href: "/o/reception/messages", label: "Messages", icon: MessageSquare },
    { href: "/o/reception/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Queue" roleLabel="Reception dashboard" nav={nav}>
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900">Queue</p>
          <p className="mt-1 text-sm text-slate-600">
            Manage arrivals, priorities, and wait times here.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

