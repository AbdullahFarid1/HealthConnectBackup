"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminNav } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Admin" roleLabel="Admin dashboard" nav={adminNav}>
      {children}
    </DashboardLayout>
  );
}
