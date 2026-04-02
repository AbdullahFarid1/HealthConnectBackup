import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientAppointments() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          My Appointments
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your upcoming and past appointments.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            <DemoRow doctor="Dr. Aisha Khan" specialty="Cardiologist" date="Mon, 14 Apr · 10:00 AM" status="confirmed" />
            <DemoRow doctor="Dr. Bilal Ahmed" specialty="Dermatologist" date="Thu, 10 Apr · 2:30 PM" status="completed" />
            <DemoRow doctor="Dr. Sara Malik" specialty="General Physician" date="Tue, 1 Apr · 11:00 AM" status="cancelled" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Connect to backend to display real data.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function DemoRow({ doctor, specialty, date, status }: { doctor: string; specialty: string; date: string; status: "confirmed" | "completed" | "cancelled" }) {
  const variant = status === "confirmed" ? "info" : status === "completed" ? "success" : "destructive";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{doctor}</p>
        <p className="text-xs text-muted-foreground">{specialty} · {date}</p>
      </div>
      <Badge variant={variant} className="capitalize">{status}</Badge>
    </div>
  );
}
