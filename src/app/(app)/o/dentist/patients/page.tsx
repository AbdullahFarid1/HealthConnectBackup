import {
  BarChart3,
  ClipboardList,
  FileText,
  Stethoscope,
  UserCircle,
} from "lucide-react";

import {
  DashboardLayout,
  type DashboardNavItem,
} from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DentistPatientsPage() {
  const nav: DashboardNavItem[] = [
    { href: "/o/dentist", label: "Overview", icon: BarChart3 },
    { href: "/o/dentist/patients", label: "My Patients", icon: Stethoscope },
    { href: "/o/dentist/appointments", label: "Appointments", icon: ClipboardList },
    { href: "/o/dentist/reports", label: "Reports", icon: FileText },
    { href: "/o/dentist/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout title="My Patients" roleLabel="Doctor dashboard" nav={nav}>
      <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900">Patients</p>
          <p className="mt-1 text-sm text-slate-600">
            Search and view your patient list here.
          </p>
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Search patients
            </label>
            <Input placeholder="Name, MRN, phone…" />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

