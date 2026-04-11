"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceptionQueue() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Queue Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s queue is managed from the overview page.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            The queue is derived from today&apos;s confirmed appointments. Check patients in,
            start consultations, and close out visits from the overview.
          </p>
          <div className="mt-4">
            <Link href="/o/reception">
              <Button className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                Go to overview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
