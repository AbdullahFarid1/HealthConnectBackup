import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-4">
        <p className="text-7xl font-black tracking-tighter text-primary">404</p>
        <h1 className="text-xl font-bold text-foreground">Page not found</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4 rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
