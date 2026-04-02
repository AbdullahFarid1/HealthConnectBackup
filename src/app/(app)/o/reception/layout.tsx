"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { receptionNav } from "@/lib/navigation";

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Reception" roleLabel="Reception dashboard" nav={receptionNav}>
      {children}
    </DashboardLayout>
  );
}
