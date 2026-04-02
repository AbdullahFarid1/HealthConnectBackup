"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { dentistNav } from "@/lib/navigation";

export default function DentistLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Doctor" roleLabel="Doctor dashboard" nav={dentistNav}>
      {children}
    </DashboardLayout>
  );
}
