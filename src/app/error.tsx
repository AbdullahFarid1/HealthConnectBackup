"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-4">
        <p className="text-5xl font-black tracking-tighter text-destructive">Oops</p>
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="mt-4 rounded-full bg-blue-600 hover:bg-blue-700">
          Try again
        </Button>
      </div>
    </div>
  );
}
