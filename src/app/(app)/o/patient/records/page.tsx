import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PatientRecords() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Medical Records</h2>
        <p className="mt-1 text-sm text-muted-foreground">Access your prescriptions, diagnoses, and visit history.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">No records yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Your medical records will appear here after your first appointment.</p>
        </CardContent>
      </Card>
    </>
  );
}
