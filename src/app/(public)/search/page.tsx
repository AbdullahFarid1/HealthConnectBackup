import Link from "next/link";
import { Building2, CalendarCheck2, MapPin, Search, Star, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const demoResults = [
  {
    name: "Dr. Aisha Khan",
    type: "Doctor",
    slug: "dr-aisha-khan",
    specialty: "Cardiologist",
    city: "Lahore",
    fee: "PKR 2,500",
    rating: "4.8",
  },
  {
    name: "City Dental & Wellness",
    type: "Clinic",
    slug: "city-dental-wellness",
    specialty: "Dentistry, Oral Surgery",
    city: "Islamabad",
    fee: "PKR 1,500",
    rating: "4.5",
  },
  {
    name: "Dr. Bilal Ahmed",
    type: "Doctor",
    slug: "dr-bilal-ahmed",
    specialty: "Dermatologist",
    city: "Karachi",
    fee: "PKR 3,000",
    rating: "4.9",
  },
] as const;

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Search
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Find a doctor or clinic.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Search by specialty, doctor name, city, or clinic.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Input placeholder="e.g. Cardiologist, Dr. Khan, Lahore…" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Cardiologist", "Dermatologist", "Dentist", "Pediatrician", "Orthopedic"].map((label) => (
                <Button key={label} variant="outline" size="sm" className="rounded-full text-xs">
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Booking tips</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Pick a specialty first, then choose a doctor.</li>
              <li>Check ratings and consultation fees upfront.</li>
              <li>Book from available time slots instantly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Results (demo)</h2>
          <p className="text-xs text-muted-foreground">UI preview — connect to real data later.</p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {demoResults.map((r) => (
            <Card key={r.slug} className="group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px]">{r.type}</Badge>
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.specialty}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-105">
                    {r.type === "Clinic" ? (
                      <Building2 className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                    ) : (
                      <Stethoscope className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500" /> {r.rating}
                  </span>
                  <span className="font-semibold text-foreground">{r.fee}</span>
                </div>

                <div className="mt-4 grid gap-2">
                  <Link href={`/c/${r.slug}`}>
                    <Button variant="outline" className="h-10 w-full rounded-xl">View Profile</Button>
                  </Link>
                  <Link href={`/book/${r.slug}`}>
                    <Button className="h-10 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                      <CalendarCheck2 className="mr-2 h-4 w-4" /> Book
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
