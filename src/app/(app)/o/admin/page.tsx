import { CalendarCheck2, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";

export default function AdminDashboard() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active users" value="—" icon={Users} />
        <StatCard title="Appointments today" value="—" icon={CalendarCheck2} />
        <StatCard title="System status" value="Healthy" icon={CheckCircle2} trend="All systems operational" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Quick Actions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage roles, users, and platform configuration.
            </p>
            <div className="mt-4 space-y-2">
              <ActionItem label="Verify pending doctors" count="3 pending" />
              <ActionItem label="Review flagged reviews" count="1 flagged" />
              <ActionItem label="Manage clinic listings" count="12 active" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Platform Health</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clean UI structure for operational reviews and governance.
            </p>
            <div className="mt-4 space-y-2">
              <ActionItem label="Total doctors" count="—" />
              <ActionItem label="Total patients" count="—" />
              <ActionItem label="Bookings this month" count="—" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ActionItem({ label, count }: { label: string; count: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-xs font-semibold text-muted-foreground">{count}</span>
    </div>
  );
}
