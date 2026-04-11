"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { receptionNav } from "@/lib/navigation";

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.mustResetPassword) {
            router.replace("/auth/reset-password");
            return;
          }
        }
      } catch { /* empty */ }
      setReady(true);
    })();
  }, [router]);

  if (!ready) return null;

  return (
    <DashboardLayout title="Reception" roleLabel="Reception dashboard" nav={receptionNav}>
      {children}
    </DashboardLayout>
  );
}
