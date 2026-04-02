import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track usage, appointment volume, and platform health.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">Analytics Dashboard</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Charts and metrics will appear here once connected to backend data.</p>
        </CardContent>
      </Card>
    </>
  );
}
