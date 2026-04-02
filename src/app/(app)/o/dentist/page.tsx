import { CalendarCheck2, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

export default function DoctorDashboard() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's appointments" value="—" icon={CalendarCheck2} />
        <StatCard title="Patients (this week)" value="—" icon={Users} />
        <StatCard title="Avg. rating" value="—" icon={Star} />
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">Today&apos;s Schedule</p>
          <p className="mt-1 text-sm text-muted-foreground">Upcoming patient appointments for today.</p>
          <div className="mt-4 space-y-3">
            <DemoRow patient="Ahmed Raza" time="10:00 AM" status="confirmed" />
            <DemoRow patient="Fatima Noor" time="11:30 AM" status="in-progress" />
            <DemoRow patient="Usman Ali" time="2:00 PM" status="pending" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DemoRow({ patient, time, status }: { patient: string; time: string; status: string }) {
  const variant = status === "confirmed" ? "info" : status === "in-progress" ? "warning" : "secondary";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{patient}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Badge variant={variant} className="capitalize">{status}</Badge>
    </div>
  );
}
