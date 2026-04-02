import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PatientProfile() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal details.</p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full name</label>
            <Input placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Phone number</label>
            <Input placeholder="+923001234567" disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">City</label>
            <Input placeholder="e.g. Lahore" />
          </div>
          <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
        </CardContent>
      </Card>
    </>
  );
}
