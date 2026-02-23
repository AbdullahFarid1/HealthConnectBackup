"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type DashboardLayoutProps = {
  title: string;
  roleLabel: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
};

export function DashboardLayout({
  title,
  roleLabel,
  nav,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-[11px] text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    HealthConnect
                  </p>
                  <p className="text-[11px] text-slate-500">{roleLabel}</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                {title}
              </span>
            </div>

            <nav className="p-3">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </p>
              <div className="space-y-1">
                {nav.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-100 p-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-700 hover:text-slate-900"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } finally {
                    window.location.href = "/login";
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4 text-slate-400" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{roleLabel}</p>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

