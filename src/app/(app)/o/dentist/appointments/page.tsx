import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorAppointments() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s and upcoming appointment lists.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            <DemoRow patient="Ahmed Raza" date="Mon, 14 Apr · 10:00 AM" type="Consultation" status="confirmed" />
            <DemoRow patient="Fatima Noor" date="Mon, 14 Apr · 11:30 AM" type="Follow-up" status="completed" />
            <DemoRow patient="Usman Ali" date="Tue, 15 Apr · 2:00 PM" type="New Patient" status="pending" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Connect to backend to display real data.</p>
        </CardContent>
      </Card>
    </>
  );
}

function DemoRow({ patient, date, type, status }: { patient: string; date: string; type: string; status: string }) {
  const variant = status === "confirmed" ? "info" : status === "completed" ? "success" : "secondary";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{patient}</p>
        <p className="text-xs text-muted-foreground">{type} · {date}</p>
      </div>
      <Badge variant={variant} className="capitalize">{status}</Badge>
    </div>
  );
}
