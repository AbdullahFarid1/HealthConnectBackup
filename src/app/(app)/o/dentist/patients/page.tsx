import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DoctorPatients() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">My Patients</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search and view your patient list.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <Input placeholder="Search by name, phone number…" />
          <p className="mt-6 text-center text-xs text-muted-foreground">Patient list will appear here once connected to backend.</p>
        </CardContent>
      </Card>
    </>
  );
}
