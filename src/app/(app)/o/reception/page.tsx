import { Clock, Timer, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

export default function ReceptionDashboard() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Checked-in" value="—" icon={Users} />
        <StatCard title="In queue" value="—" icon={Timer} />
        <StatCard title="Avg wait" value="—" icon={Clock} />
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">Today&apos;s Queue</p>
          <p className="mt-1 text-sm text-muted-foreground">Keep check-ins, scheduling, and updates in one place.</p>
          <div className="mt-4 space-y-3">
            <QueueRow patient="Fatima Noor" doctor="Dr. Aisha Khan" status="waiting" />
            <QueueRow patient="Ahmed Raza" doctor="Dr. Bilal Ahmed" status="in-consultation" />
            <QueueRow patient="Usman Ali" doctor="Dr. Sara Malik" status="done" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function QueueRow({ patient, doctor, status }: { patient: string; doctor: string; status: string }) {
  const variant = status === "waiting" ? "warning" : status === "in-consultation" ? "info" : "success";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{patient}</p>
        <p className="text-xs text-muted-foreground">with {doctor}</p>
      </div>
      <Badge variant={variant} className="capitalize">{status.replace("-", " ")}</Badge>
    </div>
  );
}
