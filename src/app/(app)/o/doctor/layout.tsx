"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { doctorNav } from "@/lib/navigation";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Doctor" roleLabel="Doctor dashboard" nav={doctorNav}>
      {children}
    </DashboardLayout>
  );
}
