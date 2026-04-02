import Link from "next/link";
import { CalendarCheck2, Clock, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

export default function PatientDashboard() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Upcoming" value="—" icon={CalendarCheck2} />
        <StatCard title="Recent visits" value="—" icon={Clock} />
        <StatCard title="Records" value="—" icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">
              Recent appointments
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest visits and upcoming schedule.
            </p>
            <div className="mt-4 space-y-2">
              <AppointmentRow
                title="Consultation"
                meta="Scheduled · Pending confirmation"
                status="active"
              />
              <AppointmentRow
                title="Follow-up"
                meta="No upcoming visits"
                status="empty"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">
              Quick actions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump to common tasks.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/o/patient/book">
                <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  Book an appointment
                </Button>
              </Link>
              <Link href="/o/patient/records">
                <Button variant="outline" className="h-11 w-full rounded-xl">
                  View medical records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AppointmentRow({
  title,
  meta,
  status,
}: {
  title: string;
  meta: string;
  status: "active" | "empty";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
      <Badge variant={status === "active" ? "success" : "secondary"}>
        {status === "active" ? "Active" : "Empty"}
      </Badge>
    </div>
  );
}
