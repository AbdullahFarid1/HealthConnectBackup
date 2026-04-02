import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">Platform Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure platform-wide settings and policies.</p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Platform Name</label>
            <Input defaultValue="HealthConnect" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Support Email</label>
            <Input placeholder="support@healthconnect.pk" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Active Cities</label>
            <Input defaultValue="Lahore, Islamabad, Karachi" />
          </div>
          <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">Save Settings</Button>
        </CardContent>
      </Card>
    </>
  );
}
