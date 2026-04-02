import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ReceptionMessages() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">Clinic updates and patient communications.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">No messages yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Messages and notifications will appear here.</p>
        </CardContent>
      </Card>
    </>
  );
}
