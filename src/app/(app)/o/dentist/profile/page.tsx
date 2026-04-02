import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DoctorProfile() {
  return (
    <>
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Doctor Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your practice details and PMDC verification.</p>
        </div>
        <Badge variant="success">PMDC Verified</Badge>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full name</label>
            <Input placeholder="Dr. Your Name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">PMDC Registration No.</label>
            <Input placeholder="12345-P" disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Primary Specialty</label>
            <Input placeholder="e.g. Cardiologist" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Consultation Fee (PKR)</label>
            <Input placeholder="e.g. 2000" type="number" />
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
