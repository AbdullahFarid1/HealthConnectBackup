import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  FileText,
  Search,
  UserCircle,
} from "lucide-react";

import { DashboardLayout, type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PatientBookPage() {
  const nav: DashboardNavItem[] = [
    { href: "/o/patient", label: "Overview", icon: BarChart3 },
    { href: "/o/patient/book", label: "Book Appointment", icon: CalendarCheck2 },
    { href: "/o/patient/appointments", label: "My Appointments", icon: ClipboardList },
    { href: "/o/patient/records", label: "Medical Records", icon: FileText },
    { href: "/o/patient/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Book Appointment" roleLabel="Patient dashboard" nav={nav}>
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Search</p>
              <p className="mt-1 text-sm text-slate-600">
                Find a clinic or specialist to book an appointment.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Search by specialty or clinic
            </label>
            <Input placeholder="e.g. cardiology, dermatology, clinic name…" />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

