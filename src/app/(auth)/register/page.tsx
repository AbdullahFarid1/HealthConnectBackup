import Link from "next/link";
import { UserPlus } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                  Start with the basics. You can complete details later.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Full name
              </label>
              <Input placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <Input
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Phone number
              </label>
              <Input placeholder="e.g. +15551234567" autoComplete="tel" />
            </div>

            <Button
              className="mt-2 h-11 w-full rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-200 hover:bg-teal-700"
              type="button"
            >
              Create account
            </Button>

            <p className="pt-2 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}

