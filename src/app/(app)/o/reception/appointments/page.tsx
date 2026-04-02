import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReceptionAppointments() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Today&apos;s Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">View today&apos;s schedule and handle check-ins.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            <Row patient="Fatima Noor" doctor="Dr. Aisha Khan" time="10:00 AM" status="checked-in" />
            <Row patient="Ahmed Raza" doctor="Dr. Bilal Ahmed" time="11:00 AM" status="scheduled" />
            <Row patient="Usman Ali" doctor="Dr. Sara Malik" time="2:00 PM" status="scheduled" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Connect to backend to display real data.</p>
        </CardContent>
      </Card>
    </>
  );
}

function Row({ patient, doctor, time, status }: { patient: string; doctor: string; time: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{patient}</p>
        <p className="text-xs text-muted-foreground">{doctor} · {time}</p>
      </div>
      <Badge variant={status === "checked-in" ? "success" : "secondary"} className="capitalize">{status}</Badge>
    </div>
  );
}
