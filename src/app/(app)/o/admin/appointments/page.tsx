import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminAppointments() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">All Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review and manage appointment records across the platform.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            <Row patient="Fatima Noor" doctor="Dr. Aisha Khan" date="14 Apr, 10:00 AM" status="confirmed" />
            <Row patient="Ahmed Raza" doctor="Dr. Bilal Ahmed" date="14 Apr, 2:30 PM" status="completed" />
            <Row patient="Usman Ali" doctor="Dr. Sara Malik" date="15 Apr, 11:00 AM" status="pending" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Connect to backend to display real data.</p>
        </CardContent>
      </Card>
    </>
  );
}

function Row({ patient, doctor, date, status }: { patient: string; doctor: string; date: string; status: string }) {
  const variant = status === "confirmed" ? "info" : status === "completed" ? "success" : "secondary";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{patient} &rarr; {doctor}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <Badge variant={variant} className="capitalize">{status}</Badge>
    </div>
  );
}
