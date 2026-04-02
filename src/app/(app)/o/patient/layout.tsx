"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { patientNav } from "@/lib/navigation";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Patient" roleLabel="Patient dashboard" nav={patientNav}>
      {children}
    </DashboardLayout>
  );
}
