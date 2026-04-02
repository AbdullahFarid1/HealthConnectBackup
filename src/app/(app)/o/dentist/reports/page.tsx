import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function DoctorReports() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">Generate and review clinical reports.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">No reports yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Clinical reports will appear here after completing appointments.</p>
        </CardContent>
      </Card>
    </>
  );
}
