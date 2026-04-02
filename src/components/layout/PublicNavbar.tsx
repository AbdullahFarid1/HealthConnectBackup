"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, HeartPulse, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

type PublicNavbarProps = {
  className?: string;
};

const navLinks = [
  { href: "/search", label: "Find a Clinic" },
  { href: "/login", label: "Login" },
];

export function PublicNavbar({ className }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              HealthConnect
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Smart care platform
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 sm:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className="h-9 rounded-xl px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <ThemeToggle />
          <Link href="/register">
            <Button className="h-9 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="animate-fade-in-up border-t border-border/60 bg-background px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl text-muted-foreground"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
