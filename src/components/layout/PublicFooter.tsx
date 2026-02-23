import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="font-medium text-slate-700">HealthConnect</p>
            <p className="text-slate-400">A role-based healthcare workspace.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="hover:text-slate-700 hover:underline">
            Home
          </Link>
          <Link href="/search" className="hover:text-slate-700 hover:underline">
            Search
          </Link>
          <Link href="/login" className="hover:text-slate-700 hover:underline">
            Login
          </Link>
          <span className="text-slate-400">
            © {new Date().getFullYear()} HealthConnect
          </span>
        </div>
      </div>
    </footer>
  );
}

