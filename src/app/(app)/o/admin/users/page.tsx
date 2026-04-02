import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Manage Users</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search users and manage role assignments.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <Input placeholder="Search by name, phone, email…" />
          <div className="mt-4 space-y-3">
            <UserRow name="Dr. Aisha Khan" role="doctor" phone="+923001234567" verified />
            <UserRow name="Ahmed Raza" role="patient" phone="+923009876543" />
            <UserRow name="Fatima Noor" role="reception" phone="+923211234567" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Connect to backend for real user data.</p>
        </CardContent>
      </Card>
    </>
  );
}

function UserRow({ name, role, phone, verified }: { name: string; role: string; phone: string; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{phone}</p>
      </div>
      <div className="flex items-center gap-2">
        {verified && <Badge variant="success">PMDC</Badge>}
        <Badge variant="secondary" className="capitalize">{role}</Badge>
      </div>
    </div>
  );
}
