import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PublicNavbarProps = {
  className?: string;
};

export function PublicNavbar({ className }: PublicNavbarProps) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              HealthConnect
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Smart care platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              className="h-9 px-4 text-sm text-slate-700 hover:text-blue-600"
            >
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="h-9 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 sm:px-5 sm:text-sm">
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

