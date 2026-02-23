import Link from "next/link";
import { Shield } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md rounded-2xl border-slate-200/70 bg-white/80 shadow-xl shadow-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Log in to continue to your HealthConnect workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <Link href="/auth/login">
              <Button className="h-11 w-full rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700">
                Continue with phone number
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                Create an account
              </Button>
            </Link>
            <div className="pt-2 text-center text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-700 hover:underline">
                Back to homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
