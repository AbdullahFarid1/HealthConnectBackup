import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PatientBook() {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Book an Appointment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a doctor by name, specialty, or city.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Input placeholder="Search doctors, specialties, clinics…" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Cardiologist", "Dermatologist", "Dentist", "Orthopedic", "ENT"].map((tag) => (
              <Button key={tag} variant="outline" size="sm" className="rounded-full text-xs">{tag}</Button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Search results will appear here once connected to backend.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
