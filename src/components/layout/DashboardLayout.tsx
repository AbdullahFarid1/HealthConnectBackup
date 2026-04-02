"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { HeartPulse, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

function SidebarContent({
  title,
  roleLabel,
  nav,
  pathname,
  onNavigate,
}: {
  title: string;
  roleLabel: string;
  nav: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">HealthConnect</p>
            <p className="text-[10px] font-medium text-muted-foreground">{roleLabel}</p>
          </div>
        </Link>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {title}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground/70 group-hover:text-primary"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border/60 p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-muted-foreground hover:text-destructive"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } finally {
              window.location.href = "/login";
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );
}

export function DashboardLayout({
  title,
  roleLabel,
  nav,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" onClose={() => setMobileOpen(false)} className="flex flex-col">
          <SidebarContent
            title={title}
            roleLabel={roleLabel}
            nav={nav}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm">
            <SidebarContent
              title={title}
              roleLabel={roleLabel}
              nav={nav}
              pathname={pathname}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
