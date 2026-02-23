import Link from "next/link";
import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  FileText,
  UserCircle,
} from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientDashboard() {
  const nav: DashboardNavItem[] = [
    { href: "/o/patient", label: "Overview", icon: BarChart3 },
    { href: "/o/patient/book", label: "Book Appointment", icon: CalendarCheck2 },
    { href: "/o/patient/appointments", label: "My Appointments", icon: ClipboardList },
    { href: "/o/patient/records", label: "Medical Records", icon: FileText },
    { href: "/o/patient/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Patient" roleLabel="Patient dashboard" nav={nav}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Upcoming appointments" value="—" />
        <StatCard title="Recent visits" value="—" />
        <StatCard title="Records available" value="—" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">Recent appointments</p>
            <p className="mt-1 text-sm text-slate-600">
              Your latest visits and upcoming schedule will appear here.
            </p>
            <div className="mt-4 space-y-2">
              <AppointmentRow title="Consultation" meta="Scheduled · Pending confirmation" />
              <AppointmentRow title="Follow-up" meta="No upcoming visits" muted />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900">Quick actions</p>
            <p className="mt-1 text-sm text-slate-600">
              Jump to the most common tasks.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/o/patient/book">
                <Button className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                  Book an appointment
                </Button>
              </Link>
              <Link href="/o/patient/records">
                <Button variant="outline" className="h-11 w-full rounded-xl">
                  View medical records
                </Button>
              </Link>
            </div>
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

function AppointmentRow({
  title,
  meta,
  muted,
}: {
  title: string;
  meta: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
      </div>
      <span
        className={
          muted
            ? "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
            : "rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700"
        }
      >
        {muted ? "Empty" : "Active"}
      </span>
    </div>
  );
}
