import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
            <HeartPulse className="h-3.5 w-3.5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-foreground">HealthConnect</p>
            <p className="text-muted-foreground">
              A role-based healthcare workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Search
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Login
          </Link>
          <span className="text-muted-foreground/70">
            &copy; {new Date().getFullYear()} HealthConnect
          </span>
        </div>
      </div>
    </footer>
  );
}
