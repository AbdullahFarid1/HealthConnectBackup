import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  FileText,
  UserCircle,
} from "lucide-react";

import {
  DashboardLayout,
  type DashboardNavItem,
} from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientProfilePage() {
  const nav: DashboardNavItem[] = [
    { href: "/o/patient", label: "Overview", icon: BarChart3 },
    { href: "/o/patient/book", label: "Book Appointment", icon: CalendarCheck2 },
    { href: "/o/patient/appointments", label: "My Appointments", icon: ClipboardList },
    { href: "/o/patient/records", label: "Medical Records", icon: FileText },
    { href: "/o/patient/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="Profile" roleLabel="Patient dashboard" nav={nav}>
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900">Profile</p>
          <p className="mt-1 text-sm text-slate-600">
            Profile details and preferences will appear here.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

