import Link from "next/link";
import { HeartPulse, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-600 to-teal-500" />
      <CardHeader className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>
              Log in to your HealthConnect account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        <Link href="/auth/login">
          <Button className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
            <Phone className="mr-2 h-4 w-4" />
            Continue with Phone Number
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" className="h-12 w-full rounded-xl">
            Create an account
          </Button>
        </Link>
        <div className="pt-3 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Back to homepage
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
