import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReceptionQueue() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Queue Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage arrivals, priorities, and wait times.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            <QueueRow pos={1} patient="Fatima Noor" time="9:45 AM" status="waiting" />
            <QueueRow pos={2} patient="Ahmed Raza" time="10:10 AM" status="waiting" />
            <QueueRow pos={3} patient="Usman Ali" time="10:30 AM" status="checked-in" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Connect to backend for live queue.</p>
        </CardContent>
      </Card>
    </>
  );
}

function QueueRow({ pos, patient, time, status }: { pos: number; patient: string; time: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{pos}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{patient}</p>
          <p className="text-xs text-muted-foreground">Arrived {time}</p>
        </div>
      </div>
      <Badge variant={status === "waiting" ? "warning" : "info"} className="capitalize">{status}</Badge>
    </div>
  );
}
